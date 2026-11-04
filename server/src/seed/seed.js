/**
 * Seeds the existing demo data (parties, items and the recent activity that the
 * dashboard used to show) THROUGH the real transaction service, so seeded
 * ledgers and stock obey exactly the same rules as live entries.
 *
 *   npm run seed            -> seeds only if the database is empty
 *   npm run seed -- --reset -> wipes parties / items / transactions first
 */
import mongoose from 'mongoose';
import { MONGODB_URI } from '../config.js';
import Party from '../models/Party.js';
import Item from '../models/Item.js';
import Transaction from '../models/Transaction.js';
import { createTransaction } from '../services/transactionService.js';

export const SUPPLIERS = [
  ['ABC Traders', '9825012345'],
  ['Patel & Co.', '9879023456'],
  ['Shree Enterprises', '9898034567'],
  ['Raj Trading Company', '9924045678'],
  ['Mahavir Traders', '9737056789'],
  ['Gujarat Agro Supplies', '9726067890'],
];

export const CUSTOMERS = [
  ['XYZ Store', '9825111222'],
  ['Mahadev Kirana', '9879333444'],
  ['Raj Enterprises', '9898555666'],
  ['Om Provision Store', '9924777888'],
  ['Sharma Distributors', '9737999000'],
];

export const ITEMS = [
  ['Ceramic Tile', 'Box', 850],
  ['Wall Tile', 'Piece', 45],
  ['Floor Tile', 'Box', 1100],
  ['Cement', 'Bag', 390],
  ['Adhesive', 'Kg', 28],
];

const at = (date, time) => new Date(`${date}T${time}:00+05:30`);

// [type, date, time, party, voucherNo, lines|amount, paymentMode]
const HISTORY = [
  ['purchase', '2026-10-28', '11:00', 'Shree Enterprises', 'PUR-1022', [['Cement', 100, 380]]],
  ['sale', '2026-10-29', '12:30', 'Shree Enterprises', 'SAL-2040', 20000, 'Bank Transfer'],
  ['debit', '2026-10-30', '10:15', 'Raj Enterprises', 'DR-085', [['Cement', 40, 420]]],
  ['purchase', '2026-10-31', '17:40', 'Gujarat Agro Supplies', 'PUR-1023', [['Ceramic Tile', 20, 850], ['Adhesive', 100, 28], ['Wall Tile', 100, 20]]],
  ['debit', '2026-11-01', '11:05', 'Om Provision Store', 'DR-086', [['Adhesive', 50, 185]]],
  ['debit', '2026-11-01', '13:15', 'Sharma Distributors', 'DR-087', [['Wall Tile', 100, 45]]],
  ['purchase', '2026-11-01', '16:20', 'Patel & Co.', 'PUR-1024', [['Cement', 20, 300]]],
  ['credit', '2026-11-01', '18:10', 'Raj Enterprises', 'CR-105', 15000, 'Bank Transfer'],
  ['debit', '2026-11-02', '09:50', 'Mahadev Kirana', 'DR-088', [['Cement', 20, 500]]],
  ['purchase', '2026-11-02', '10:30', 'ABC Traders', 'PUR-1025', [['Floor Tile', 10, 1200]]],
  ['debit', '2026-11-02', '11:45', 'XYZ Store', 'DR-089', [['Ceramic Tile', 10, 850]]],
  ['sale', '2026-11-02', '14:00', 'ABC Traders', 'SAL-2041', 5000, 'Cash'],
];

export async function seed({ reset = false } = {}) {
  if (reset) await Promise.all([Party.deleteMany({}), Item.deleteMany({}), Transaction.deleteMany({})]);
  else if ((await Party.countDocuments()) > 0) return false;

  await Party.insertMany([
    ...SUPPLIERS.map(([name, phone]) => ({ name, phone, type: 'supplier' })),
    ...CUSTOMERS.map(([name, phone]) => ({ name, phone, type: 'customer' })),
  ]);
  await Item.insertMany(ITEMS.map(([name, unit, price]) => ({ name, unit, price })));

  const parties = new Map((await Party.find()).map((p) => [p.name, p]));
  const items = new Map((await Item.find()).map((i) => [i.name, i]));

  for (const [type, date, time, partyName, voucherNo, body, mode] of HISTORY) {
    const input = { type, date, voucherNo, partyId: String(parties.get(partyName)._id) };
    if (Array.isArray(body)) input.items = body.map(([n, qty, rate]) => ({ itemId: String(items.get(n)._id), qty, rate }));
    else Object.assign(input, { amount: body, paymentMode: mode });
    await createTransaction(input, { createdAt: at(date, time) });
  }
  return true;
}

// Run directly: node src/seed/seed.js [--reset]
if (import.meta.url === `file://${process.argv[1]}`) {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const did = await seed({ reset: process.argv.includes('--reset') });
  console.log(did ? `Seeded ${HISTORY.length} transactions into ${mongoose.connection.name}` : 'Database already has data — skipped (use --reset to start over)');
  await mongoose.disconnect();
}
