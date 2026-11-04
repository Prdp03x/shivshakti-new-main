import { Router } from 'express';
import mongoose from 'mongoose';
import { timingSafeEqual } from 'node:crypto';
import { EJSON } from 'bson';
import Party from '../models/Party.js';
import Item from '../models/Item.js';
import Transaction from '../models/Transaction.js';
import Unit from '../models/Unit.js';
import { AppError } from '../errors.js';
import { TX, NORMAL_SIDE } from '../accounting/rules.js';
import { buildStatement, partyTotals, sortChronological } from '../accounting/ledger.js';
import { createTransaction, nextVoucher, reconcileStock } from '../services/transactionService.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const KIND = { customers: 'customer', suppliers: 'supplier' };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---- reference data ----------------------------------------------------------
router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/rules', (_req, res) => res.json({ rules: TX, normalSide: NORMAL_SIDE }));

router.get(
  '/parties',
  wrap(async (req, res) => {
    const filter = req.query.type ? { type: String(req.query.type) } : {};
    const parties = await Party.find(filter).sort({ nameKey: 1 });
    res.json(parties);
  })
);

router.post(
  '/parties',
  wrap(async (req, res) => {
    const { name, phone = '', type } = req.body ?? {};
    if (!String(name ?? '').trim()) throw new AppError(400, 'Party name is required');
    if (!['customer', 'supplier'].includes(type)) throw new AppError(400, 'Party type must be customer or supplier');
    if (phone && !/^\d{10}$/.test(phone)) throw new AppError(400, 'Phone must be 10 digits');
    const opening = Number(req.body.openingBalance ?? 0);
    if (!Number.isFinite(opening)) throw new AppError(400, 'Invalid opening balance');
    try {
      const party = await Party.create({ name, phone, type, openingBalance: opening });
      res.status(201).json(party);
    } catch (e) {
      if (e?.code === 11000) throw new AppError(409, `A ${type} named "${String(name).trim()}" already exists`);
      throw e;
    }
  })
);

router.get(
  '/items',
  wrap(async (_req, res) => res.json(await Item.find().sort({ name: 1 })))
);

// ---- master maintenance ------------------------------------------------------
router.put('/parties/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid party');
  const party = await Party.findById(req.params.id);
  if (!party) throw new AppError(404, 'Party not found');
  const name = String(req.body.name ?? party.name).trim();
  const phone = String(req.body.phone ?? party.phone).trim();
  if (!name) throw new AppError(400, 'Party name is required');
  if (phone && !/^\d{10}$/.test(phone)) throw new AppError(400, 'Phone must be 10 digits');
  party.name = name; party.phone = phone;
  if (req.body.openingBalance !== undefined) {
    const openingBalance = Number(req.body.openingBalance);
    if (!Number.isFinite(openingBalance)) throw new AppError(400, 'Invalid opening balance');
    party.openingBalance = openingBalance;
  }
  try { await party.save(); } catch (e) { if (e?.code === 11000) throw new AppError(409, 'A party with this name already exists'); throw e; }
  res.json(party);
}));

router.delete('/parties/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid party');
  if (await Transaction.exists({ partyId: req.params.id })) throw new AppError(409, 'This party has transactions and cannot be deleted.');
  const removed = await Party.findByIdAndDelete(req.params.id);
  if (!removed) throw new AppError(404, 'Party not found');
  res.json({ ok: true });
}));

router.post('/items', wrap(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const unit = String(req.body.unit ?? '').trim();
  if (!name || !unit) throw new AppError(400, 'Item name and unit are required');
  const openingStock = Number(req.body.openingStock ?? 0);
  const purchaseRate = Number(req.body.purchaseRate ?? req.body.price ?? 0);
  const saleRate = Number(req.body.saleRate ?? 0);
  const minStock = Number(req.body.minStock ?? 0);
  if (![openingStock, purchaseRate, saleRate, minStock].every((n) => Number.isFinite(n) && n >= 0)) throw new AppError(400, 'Item quantities and rates must be non-negative numbers');
  const item = await Item.create({ code: String(req.body.code ?? '').trim(), name, unit, price: purchaseRate, purchaseRate, saleRate, openingStock, minStock, stock: openingStock });
  res.status(201).json(item);
}));

router.put('/items/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid item');
  const item = await Item.findById(req.params.id);
  if (!item) throw new AppError(404, 'Item not found');
  const name = String(req.body.name ?? item.name).trim();
  const unit = String(req.body.unit ?? item.unit).trim();
  if (!name || !unit) throw new AppError(400, 'Item name and unit are required');
  const purchaseRate = Number(req.body.purchaseRate ?? item.purchaseRate ?? item.price ?? 0);
  const saleRate = Number(req.body.saleRate ?? item.saleRate ?? 0);
  const minStock = Number(req.body.minStock ?? item.minStock ?? 0);
  if (![purchaseRate, saleRate, minStock].every((n) => Number.isFinite(n) && n >= 0)) throw new AppError(400, 'Rates and minimum stock must be non-negative');
  if (req.body.openingStock !== undefined && Number(req.body.openingStock) !== Number(item.openingStock ?? 0)) {
    const hasHistory = await Transaction.exists({ 'items.itemId': item._id });
    if (hasHistory) throw new AppError(409, 'Opening stock cannot be changed after this item has transaction history.');
    const openingStock = Number(req.body.openingStock);
    if (!Number.isFinite(openingStock) || openingStock < 0) throw new AppError(400, 'Opening stock must be a non-negative number');
    item.openingStock = openingStock; item.stock = openingStock;
  }
  item.name = name; item.unit = unit; item.code = String(req.body.code ?? item.code ?? '').trim();
  item.purchaseRate = purchaseRate; item.price = purchaseRate; item.saleRate = saleRate; item.minStock = minStock;
  await item.save(); res.json(item);
}));

router.delete('/items/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid item');
  if (await Transaction.exists({ 'items.itemId': req.params.id })) throw new AppError(409, 'This item is used in transaction history and cannot be deleted.');
  const removed = await Item.findByIdAndDelete(req.params.id);
  if (!removed) throw new AppError(404, 'Item not found');
  res.json({ ok: true });
}));

router.get('/units', wrap(async (_req, res) => {
  // Preserve compatibility with items created before the Units master existed.
  const existing = await Item.distinct('unit');
  for (const name of existing.filter(Boolean)) {
    const shortName = name.length <= 4 ? name : name.slice(0, 3);
    await Unit.updateOne({ name }, { $setOnInsert: { name, shortName } }, { upsert: true });
  }
  res.json(await Unit.find().sort({ name: 1 }));
}));
router.post('/units', wrap(async (req, res) => {
  const name = String(req.body.name ?? '').trim(); const shortName = String(req.body.shortName ?? '').trim();
  if (!name || !shortName) throw new AppError(400, 'Unit name and short name are required');
  try { res.status(201).json(await Unit.create({ name, shortName })); } catch (e) { if (e?.code === 11000) throw new AppError(409, 'This unit already exists'); throw e; }
}));
router.put('/units/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid unit');
  const unit = await Unit.findById(req.params.id); if (!unit) throw new AppError(404, 'Unit not found');
  const oldName = unit.name;
  unit.name = String(req.body.name ?? unit.name).trim(); unit.shortName = String(req.body.shortName ?? unit.shortName).trim();
  if (!unit.name || !unit.shortName) throw new AppError(400, 'Unit name and short name are required');
  try { await unit.save(); } catch (e) { if (e?.code === 11000) throw new AppError(409, 'This unit already exists'); throw e; }
  if (oldName !== unit.name) await Item.updateMany({ unit: oldName }, { $set: { unit: unit.name } });
  res.json(unit);
}));
router.delete('/units/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid unit');
  const unit = await Unit.findById(req.params.id); if (!unit) throw new AppError(404, 'Unit not found');
  if (await Item.exists({ unit: unit.name })) throw new AppError(409, 'This unit is assigned to one or more items. Change those items first.');
  await unit.deleteOne(); res.json({ ok: true });
}));

// ---- transactions ------------------------------------------------------------
router.get(
  '/transactions/next-voucher',
  wrap(async (req, res) => res.json({ voucherNo: await nextVoucher(String(req.query.type)) }))
);

router.get(
  '/transactions',
  wrap(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const all = await Transaction.find().lean();
    const recent = sortChronological(all).reverse().slice(0, limit);
    res.json(recent.map((t) => ({ ...t, id: String(t._id), partyId: String(t.partyId), _id: undefined, __v: undefined })));
  })
);

router.post(
  '/transactions',
  wrap(async (req, res) => res.status(201).json(await createTransaction(req.body)))
);

router.get('/stock/reconcile', wrap(async (_req, res) => {
  const rows = await reconcileStock();
  res.json({ ok: rows.every((r) => r.ok), items: rows });
}));

// ---- ledgers -----------------------------------------------------------------
async function txnsByParty(partyType) {
  const txns = await Transaction.find({ partyType }).lean();
  const map = new Map();
  for (const t of txns) {
    const k = String(t.partyId);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  }
  return map;
}

// Summary table: all customers (Customer Ledger) or all suppliers (Owner's Ledger)
router.get(
  '/ledger/:kind',
  wrap(async (req, res) => {
    const partyType = KIND[req.params.kind];
    if (!partyType) throw new AppError(404, 'Unknown ledger');
    const [parties, byParty] = await Promise.all([Party.find({ type: partyType }).sort({ nameKey: 1 }), txnsByParty(partyType)]);
    const rows = parties.map((p) => ({
      id: String(p._id),
      name: p.name,
      phone: p.phone,
      ...partyTotals(p, byParty.get(String(p._id)) ?? []),
    }));
    res.json({
      kind: req.params.kind,
      partyType,
      normalSide: NORMAL_SIDE[partyType],
      rows,
      totals: {
        debit: rows.reduce((s, r) => s + Math.round(r.totalDebit * 100), 0) / 100,
        credit: rows.reduce((s, r) => s + Math.round(r.totalCredit * 100), 0) / 100,
        outstanding: rows.reduce((s, r) => s + Math.round(r.closing.signed * 100), 0) / 100,
      },
    });
  })
);

// Individual statement
router.get(
  '/ledger/:kind/:partyId',
  wrap(async (req, res) => {
    const partyType = KIND[req.params.kind];
    if (!partyType) throw new AppError(404, 'Unknown ledger');
    if (!mongoose.isValidObjectId(req.params.partyId)) throw new AppError(400, 'Invalid party');
    const party = await Party.findById(req.params.partyId);
    if (!party || party.type !== partyType) throw new AppError(404, 'Party not found in this ledger');
    const { from, to, type, q } = req.query;
    for (const d of [from, to]) if (d && !DATE_RE.test(d)) throw new AppError(400, 'Dates must be YYYY-MM-DD');
    if (type && !TX[type]) throw new AppError(400, 'Unknown transaction type');
    const txns = await Transaction.find({ partyId: party._id }).lean();
    res.json(buildStatement({ party, txns, from, to, type, q: q ? String(q) : '' }));
  })
);


// ---- backup and restore ------------------------------------------------------
const BACKUP_COLLECTIONS = ['parties', 'items', 'transactions', 'units'];

function requireBackupKey(req, _res, next) {
  const configured = process.env.BACKUP_RESTORE_KEY || '';
  const supplied = String(req.get('x-backup-key') || '');
  if (!configured) return next(new AppError(503, 'Backup/restore is disabled. Configure BACKUP_RESTORE_KEY on the server first.'));
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return next(new AppError(403, 'Invalid backup key'));
  next();
}

router.get('/backup/export', requireBackupKey, wrap(async (_req, res) => {
  const collections = {};
  for (const name of BACKUP_COLLECTIONS) {
    const exists = await mongoose.connection.db.listCollections({ name }, { nameOnly: true }).hasNext();
    collections[name] = exists ? await mongoose.connection.db.collection(name).find({}).toArray() : [];
  }
  const backup = {
    format: 'shivshakti-billing-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    database: mongoose.connection.name,
    collections: Object.fromEntries(Object.entries(collections).map(([name, docs]) => [name, docs.map((doc) => EJSON.serialize(doc))])),
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="shivshakti-backup-${stamp}.json"`);
  res.json(backup);
}));

router.post('/backup/restore', requireBackupKey, wrap(async (req, res) => {
  const backup = req.body;
  if (!backup || backup.format !== 'shivshakti-billing-backup' || backup.version !== 1 || !backup.collections || typeof backup.collections !== 'object') {
    throw new AppError(400, 'Invalid or unsupported Shivshakti backup file');
  }
  // Require a complete app snapshot. This prevents accidentally restoring a partial file
  // and silently erasing collections that were not included in it.
  for (const name of BACKUP_COLLECTIONS) {
    if (!Array.isArray(backup.collections[name])) throw new AppError(400, `Backup is missing the ${name} collection`);
  }
  const restored = {};
  const decoded = {};
  for (const name of BACKUP_COLLECTIONS) {
    try {
      decoded[name] = backup.collections[name].map((doc) => EJSON.deserialize(doc));
      if (decoded[name].some((doc) => !doc || typeof doc !== 'object' || Array.isArray(doc) || !doc._id)) {
        throw new Error('Every document must be an object with an _id');
      }
    } catch (error) {
      throw new AppError(400, `Invalid ${name} collection in backup: ${error.message}`);
    }
  }
  // Replace only the four application collections. Collection definitions and indexes
  // are retained; unrelated collections in the same database are not touched.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const name of BACKUP_COLLECTIONS) {
        const collection = mongoose.connection.db.collection(name);
        await collection.deleteMany({}, { session });
        if (decoded[name].length) await collection.insertMany(decoded[name], { ordered: true, session });
        restored[name] = decoded[name].length;
      }
    });
  } finally {
    await session.endSession();
  }
  // Do not call createIndexes() here. The application already manages indexes
  // when models are initialized. Recreating them after every restore can fail
  // when an existing index has the same name/key but different options (for
  // example, an older non-unique Unit.name index versus the current unique one).
  // Restore only replaces documents; it must not mutate collection indexes.
  res.json({ ok: true, restored, message: 'Backup restored successfully' });
}));

// ---- dashboard ---------------------------------------------------------------
router.get(
  '/summary',
  wrap(async (_req, res) => {
    const [parties, itemCount, txns] = await Promise.all([Party.find(), Item.countDocuments(), Transaction.find().lean()]);
    let receivables = 0;
    let payables = 0;
    for (const p of parties) {
      const c = partyTotals(p, txns.filter((t) => String(t.partyId) === String(p._id))).closing;
      if (c.signed > 0) (p.type === 'customer' ? (receivables += c.signed) : (payables += c.signed));
    }
    res.json({ totalParties: parties.length, totalItems: itemCount, pendingReceivables: receivables, pendingPayables: payables });
  })
);

export default router;
