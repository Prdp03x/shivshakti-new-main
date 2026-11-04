import mongoose from 'mongoose';
import Party from '../models/Party.js';
import Item from '../models/Item.js';
import Transaction from '../models/Transaction.js';
import { AppError } from '../errors.js';
import { TX, PAYMENT_MODES, accountNameFor } from '../accounting/rules.js';
import { toPaise, fromPaise, partyTotals } from '../accounting/ledger.js';

const round3 = (n) => Math.round(n * 1000) / 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WIDTH = { PUR: 4, SAL: 4, DR: 3, CR: 3 };

/** Next voucher number for a type, e.g. PUR-1025 -> PUR-1026 (keeps zero padding). */
export async function nextVoucher(type) {
  const rule = TX[type];
  if (!rule) throw new AppError(400, 'Unknown transaction type');
  const docs = await Transaction.find({ type }, { voucherNo: 1 }).lean();
  let max = null;
  let width = WIDTH[rule.prefix];
  for (const d of docs) {
    const m = /^([A-Za-z]+)-(\d+)$/.exec(d.voucherNo);
    if (m && m[1].toUpperCase() === rule.prefix) {
      const n = Number(m[2]);
      if (max === null || n > max) {
        max = n;
        width = m[2].length;
      }
    }
  }
  const next = max === null ? rule.first : max + 1;
  return `${rule.prefix}-${String(next).padStart(width, '0')}`;
}

// ---- stock -----------------------------------------------------------------
// Only purchase (+) and debit entry (-) ever reach this code. Each step is a
// single atomic update; if any later step fails the applied ones are reversed,
// so a failed transaction never leaves stock changed.
async function applyStock(effect, qtyByItem, applied) {
  for (const [itemId, qty] of qtyByItem) {
    if (effect === 'increase') {
      await Item.updateOne({ _id: itemId }, { $inc: { stock: qty } });
    } else {
      const updated = await Item.findOneAndUpdate(
        { _id: itemId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { returnDocument: 'after' }
      );
      if (!updated) {
        const item = await Item.findById(itemId).lean();
        throw new AppError(422, `Insufficient stock for ${item?.name ?? 'item'}: available ${item?.stock ?? 0}, requested ${qty}`);
      }
    }
    applied.push([itemId, effect === 'increase' ? qty : -qty]);
  }
}

async function rollbackStock(applied) {
  for (const [itemId, delta] of applied) await Item.updateOne({ _id: itemId }, { $inc: { stock: -delta } });
}

// ---- create ----------------------------------------------------------------
// Postings run one at a time inside this server process. Together with the atomic
// guarded stock updates below, this makes the stock check + deduction and automatic
// voucher numbering safe even under a burst of simultaneous requests.
let queue = Promise.resolve();
export function createTransaction(input, opts) {
  const run = queue.then(() => postTransaction(input, opts));
  queue = run.catch(() => {});
  return run;
}

async function postTransaction(input, { createdAt } = {}) {
  const rule = TX[input?.type];
  if (!rule) throw new AppError(400, 'Unknown transaction type');

  if (!mongoose.isValidObjectId(input.partyId)) throw new AppError(400, 'Select a party');
  const party = await Party.findById(input.partyId);
  if (!party) throw new AppError(404, 'Party not found');
  if (party.type !== rule.partyType)
    throw new AppError(422, `${rule.label} must be recorded against a ${rule.partyType}, but "${party.name}" is a ${party.type}`);

  if (!DATE_RE.test(input.date ?? '')) throw new AppError(400, 'A valid date (YYYY-MM-DD) is required');

  const voucherNo = String(input.voucherNo ?? '').trim() || (await nextVoucher(input.type));
  if (await Transaction.exists({ type: input.type, voucherNo }))
    throw new AppError(409, `${rule.label} number ${voucherNo} already exists`);

  // Amounts are always computed here — the client's totals are never trusted.
  let lines = [];
  let amountPaise = 0;
  let paymentMode;
  const qtyByItem = new Map();

  if (rule.hasItems) {
    if (!Array.isArray(input.items) || input.items.length === 0) throw new AppError(400, 'Add at least one item');
    const ids = input.items.map((l) => l.itemId);
    if (!ids.every((i) => mongoose.isValidObjectId(i))) throw new AppError(400, 'Invalid item selected');
    const found = await Item.find({ _id: { $in: ids } }).lean();
    const byId = new Map(found.map((i) => [String(i._id), i]));
    for (const l of input.items) {
      const item = byId.get(String(l.itemId));
      if (!item) throw new AppError(404, 'Item not found');
      const qty = round3(Number(l.qty));
      const rate = Number(l.rate);
      if (!(qty > 0)) throw new AppError(400, `Quantity must be greater than 0 for ${item.name}`);
      if (!(rate > 0)) throw new AppError(400, `Rate must be greater than 0 for ${item.name}`);
      const amount = fromPaise(toPaise(qty * rate));
      lines.push({ itemId: item._id, name: item.name, unit: item.unit, qty, rate, amount });
      amountPaise += toPaise(amount);
      qtyByItem.set(String(item._id), round3((qtyByItem.get(String(item._id)) ?? 0) + qty));
    }
  } else {
    const amount = Number(input.amount);
    if (!(amount > 0)) throw new AppError(400, 'Amount must be greater than 0');
    paymentMode = input.paymentMode;
    if (!PAYMENT_MODES.includes(paymentMode)) throw new AppError(400, 'Select a valid payment mode');
    amountPaise = toPaise(amount);
  }

  const applied = [];
  try {
    if (rule.stockEffect !== 'none') await applyStock(rule.stockEffect, qtyByItem, applied);
    const txn = await Transaction.create({
      type: input.type,
      partyId: party._id,
      partyType: party.type,
      partyName: party.name,
      date: input.date,
      voucherNo,
      items: lines,
      paymentMode,
      accountName: accountNameFor(input.type, paymentMode),
      notes: String(input.notes ?? '').trim(),
      amount: fromPaise(amountPaise),
      ledgerSide: rule.ledgerSide,
      stockEffect: rule.stockEffect,
      ...(createdAt ? { createdAt } : {}),
    });
    const partyTxns = await Transaction.find({ partyId: party._id }).lean();
    return { transaction: txn.toJSON(), partyBalance: partyTotals(party, partyTxns).closing };
  } catch (e) {
    await rollbackStock(applied);
    if (e?.code === 11000) throw new AppError(409, `${rule.label} number ${voucherNo} already exists`);
    throw e;
  }
}

/** Expected stock per item recomputed from the transaction history (integrity check). */
export async function reconcileStock() {
  const [items, txns] = await Promise.all([Item.find().lean(), Transaction.find({ stockEffect: { $ne: 'none' } }).lean()]);
  const delta = new Map();
  for (const t of txns)
    for (const l of t.items) {
      const k = String(l.itemId);
      delta.set(k, (delta.get(k) ?? 0) + (t.stockEffect === 'increase' ? l.qty : -l.qty));
    }
  return items.map((i) => {
    const expected = round3((i.openingStock ?? 0) + (delta.get(String(i._id)) ?? 0));
    return { id: String(i._id), name: i.name, stored: round3(i.stock), expected, ok: round3(i.stock) === expected };
  });
}
