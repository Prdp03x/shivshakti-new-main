// Integration tests: real Mongoose models against a live MongoDB.
//   MONGODB_URI_TEST=mongodb://127.0.0.1:27017/shivshakti_billing_test npm test
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { seed } from '../src/seed/seed.js';

const URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/shivshakti_billing_test';
let server;
let base;
let ids; // name -> id

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const post = (path, body) => call('POST', path, body);
const get = (path) => call('GET', path);

const stock = async () => Object.fromEntries((await get('/api/items')).body.map((i) => [i.name, i.stock]));
const closing = async (kind, name) => (await get(`/api/ledger/${kind}`)).body.rows.find((r) => r.name === name).closing;
const txnCount = async () => (await get('/api/transactions?limit=500')).body.length;

before(async () => {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  await seed({ reset: true });
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  const parties = (await get('/api/parties')).body;
  const items = (await get('/api/items')).body;
  ids = Object.fromEntries([...parties, ...items].map((x) => [x.name, x.id]));
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('seeded history gives the expected balances, stock and totals', async () => {
  const sup = (await get('/api/ledger/suppliers')).body;
  const cus = (await get('/api/ledger/customers')).body;
  const bal = (rows) => Object.fromEntries(rows.map((r) => [r.name, `${r.closing.amount} ${r.closing.sideCode}`]));
  assert.deepEqual(bal(sup.rows), {
    'ABC Traders': '7000 Cr',
    'Gujarat Agro Supplies': '21800 Cr',
    'Mahavir Traders': '0 Cr',
    'Patel & Co.': '6000 Cr',
    'Raj Trading Company': '0 Cr',
    'Shree Enterprises': '18000 Cr',
  });
  assert.deepEqual(bal(cus.rows), {
    'Mahadev Kirana': '10000 Dr',
    'Om Provision Store': '9250 Dr',
    'Raj Enterprises': '1800 Dr',
    'Sharma Distributors': '4500 Dr',
    'XYZ Store': '8500 Dr',
  });
  assert.deepEqual(await stock(), { Adhesive: 50, 'Ceramic Tile': 10, Cement: 60, 'Floor Tile': 10, 'Wall Tile': 0 });
  const summary = (await get('/api/summary')).body;
  assert.equal(summary.pendingPayables, 52800);
  assert.equal(summary.pendingReceivables, 34050);
  assert.equal(summary.totalParties, 11);
  assert.equal(summary.totalItems, 5);
  assert.equal((await get('/api/stock/reconcile')).body.ok, true);
});

test('next voucher numbers continue each series', async () => {
  const next = async (type) => (await get(`/api/transactions/next-voucher?type=${type}`)).body.voucherNo;
  assert.equal(await next('purchase'), 'PUR-1026');
  assert.equal(await next('sale'), 'SAL-2042');
  assert.equal(await next('debit'), 'DR-090');
  assert.equal(await next('credit'), 'CR-106');
});

test('PURCHASE: supplier Credit, stock increases', async () => {
  const r = await post('/api/transactions', {
    type: 'purchase', partyId: ids['Mahavir Traders'], date: '2026-11-03', voucherNo: 'PUR-1026',
    items: [{ itemId: ids['Wall Tile'], qty: 50, rate: 40 }],
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.transaction.amount, 2000);
  assert.equal(r.body.transaction.ledgerSide, 'credit');
  assert.equal(r.body.transaction.stockEffect, 'increase');
  assert.deepEqual(r.body.partyBalance, { signed: 2000, amount: 2000, side: 'credit', sideCode: 'Cr' });
  assert.equal((await stock())['Wall Tile'], 50);
});

test('NEW SALE (payment to supplier): supplier Debit, balance falls, NO stock change', async () => {
  const before = await stock();
  const r = await post('/api/transactions', {
    type: 'sale', partyId: ids['Mahavir Traders'], date: '2026-11-03', amount: 500, paymentMode: 'UPI',
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.transaction.ledgerSide, 'debit');
  assert.equal(r.body.transaction.stockEffect, 'none');
  assert.equal(r.body.transaction.items.length, 0);
  assert.equal(r.body.transaction.accountName, 'UPI A/c');
  assert.equal(r.body.partyBalance.amount, 1500);
  assert.deepEqual(await stock(), before);
});

test('DEBIT ENTRY (customer bill): customer Debit, stock decreases', async () => {
  const r = await post('/api/transactions', {
    type: 'debit', partyId: ids['XYZ Store'], date: '2026-11-03',
    items: [{ itemId: ids['Wall Tile'], qty: 30, rate: 60 }],
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.transaction.amount, 1800);
  assert.equal(r.body.transaction.ledgerSide, 'debit');
  assert.equal(r.body.transaction.voucherNo, 'DR-090');
  assert.equal(r.body.partyBalance.amount, 10300);
  assert.equal((await stock())['Wall Tile'], 20);
});

test('CREDIT ENTRY (customer payment): customer Credit, balance falls, NO stock change', async () => {
  const before = await stock();
  const r = await post('/api/transactions', {
    type: 'credit', partyId: ids['XYZ Store'], date: '2026-11-03', amount: 2000, paymentMode: 'Cash',
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.transaction.ledgerSide, 'credit');
  assert.equal(r.body.transaction.stockEffect, 'none');
  assert.equal(r.body.partyBalance.amount, 8300);
  assert.deepEqual(await stock(), before);
});

test('overselling is rejected and a partly-applied multi-item bill is rolled back', async () => {
  const stockBefore = await stock();
  const countBefore = await txnCount();
  const single = await post('/api/transactions', {
    type: 'debit', partyId: ids['XYZ Store'], date: '2026-11-03',
    items: [{ itemId: ids['Wall Tile'], qty: 25, rate: 60 }],
  });
  assert.equal(single.status, 422);
  assert.match(single.body.error, /Insufficient stock for Wall Tile/);

  // Cement (60 in stock) is deducted first, then Wall Tile fails -> Cement must be restored.
  const multi = await post('/api/transactions', {
    type: 'debit', partyId: ids['XYZ Store'], date: '2026-11-03',
    items: [{ itemId: ids['Cement'], qty: 10, rate: 500 }, { itemId: ids['Wall Tile'], qty: 25, rate: 60 }],
  });
  assert.equal(multi.status, 422);
  assert.deepEqual(await stock(), stockBefore);
  assert.equal(await txnCount(), countBefore);
  assert.equal((await closing('customers', 'XYZ Store')).amount, 8300);
});

test('a burst of 12 simultaneous bills never sells more than the stock', async () => {
  assert.equal((await stock())['Wall Tile'], 20);
  const bill = () =>
    post('/api/transactions', {
      type: 'debit', partyId: ids['Sharma Distributors'], date: '2026-11-03', // voucher numbers auto-assigned
      items: [{ itemId: ids['Wall Tile'], qty: 5, rate: 50 }], // 12 x 5 requested, only 20 in stock
    });
  const results = await Promise.all(Array.from({ length: 12 }, bill));
  const ok = results.filter((r) => r.status === 201);
  assert.equal(ok.length, 4);
  assert.equal(results.filter((r) => r.status === 422).length, 8);
  assert.equal(new Set(ok.map((r) => r.body.transaction.voucherNo)).size, 4); // no duplicate voucher numbers
  assert.equal((await stock())['Wall Tile'], 0);
  assert.equal((await get('/api/stock/reconcile')).body.ok, true);
});

test('a burst of simultaneous payments gets unique, gap-free voucher numbers', async () => {
  const pay = () => post('/api/transactions', { type: 'credit', partyId: ids['Mahadev Kirana'], date: '2026-11-03', amount: 100, paymentMode: 'Cash' });
  const results = await Promise.all(Array.from({ length: 8 }, pay));
  assert.ok(results.every((r) => r.status === 201));
  const nums = results.map((r) => Number(r.body.transaction.voucherNo.split('-')[1])).sort((a, b) => a - b);
  assert.deepEqual(nums, Array.from({ length: 8 }, (_, i) => nums[0] + i));
  assert.equal((await closing('customers', 'Mahadev Kirana')).amount, 10000 - 800);
});

test('wrong party type and duplicate voucher numbers are rejected', async () => {
  const before = await stock();
  const a = await post('/api/transactions', { type: 'purchase', partyId: ids['XYZ Store'], date: '2026-11-03', items: [{ itemId: ids['Cement'], qty: 1, rate: 1 }] });
  assert.equal(a.status, 422);
  const b = await post('/api/transactions', { type: 'credit', partyId: ids['ABC Traders'], date: '2026-11-03', amount: 10, paymentMode: 'Cash' });
  assert.equal(b.status, 422);
  const c = await post('/api/transactions', { type: 'sale', partyId: ids['XYZ Store'], date: '2026-11-03', amount: 10, paymentMode: 'Cash' });
  assert.equal(c.status, 422);
  const d = await post('/api/transactions', { type: 'purchase', partyId: ids['ABC Traders'], date: '2026-11-03', voucherNo: 'PUR-1025', items: [{ itemId: ids['Cement'], qty: 1, rate: 1 }] });
  assert.equal(d.status, 409);
  assert.deepEqual(await stock(), before); // the duplicate must not have added stock
});

test('validation: amounts, quantities, payment mode and dates', async () => {
  const p = ids['ABC Traders'];
  assert.equal((await post('/api/transactions', { type: 'sale', partyId: p, date: '2026-11-03', amount: 0, paymentMode: 'Cash' })).status, 400);
  assert.equal((await post('/api/transactions', { type: 'sale', partyId: p, date: '2026-11-03', amount: 5, paymentMode: 'Cheque' })).status, 400);
  assert.equal((await post('/api/transactions', { type: 'sale', partyId: p, date: '03/11/2026', amount: 5, paymentMode: 'Cash' })).status, 400);
  assert.equal((await post('/api/transactions', { type: 'purchase', partyId: p, date: '2026-11-03', items: [] })).status, 400);
  assert.equal((await post('/api/transactions', { type: 'purchase', partyId: p, date: '2026-11-03', items: [{ itemId: ids['Cement'], qty: -2, rate: 5 }] })).status, 400);
  assert.equal((await post('/api/transactions', { type: 'nope', partyId: p, date: '2026-11-03' })).status, 400);
});

test('over-payment shows the supplier balance on the opposite (Dr) side', async () => {
  const r = await post('/api/transactions', { type: 'sale', partyId: ids['Patel & Co.'], date: '2026-11-03', amount: 10000, paymentMode: 'Cash' });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.partyBalance, { signed: -4000, amount: 4000, side: 'debit', sideCode: 'Dr' });
});

test('customer statement: running balance, totals, filters', async () => {
  const s = (await get(`/api/ledger/customers/${ids['Raj Enterprises']}`)).body;
  assert.deepEqual(s.rows.map((r) => [r.voucherNo, r.debit, r.credit, r.closing.amount, r.closing.sideCode, r.accountName]), [
    ['DR-085', 16800, 0, 16800, 'Dr', 'Sales A/c'],
    ['CR-105', 0, 15000, 1800, 'Dr', 'Bank A/c'],
  ]);
  assert.deepEqual(s.totals, { credit: 15000, debit: 16800 });
  assert.equal(s.closing.amount, 1800);

  const ranged = (await get(`/api/ledger/customers/${ids['Raj Enterprises']}?from=2026-11-01&to=2026-11-30`)).body;
  assert.equal(ranged.opening.amount, 16800);
  assert.equal(ranged.rows.length, 1);
  assert.equal(ranged.closing.amount, 1800);

  const credits = (await get(`/api/ledger/customers/${ids['Raj Enterprises']}?type=credit`)).body;
  assert.equal(credits.rows.length, 1);
  assert.equal(credits.rows[0].closing.amount, 1800); // filter doesn't alter the running balance
  const found = (await get(`/api/ledger/customers/${ids['Raj Enterprises']}?q=cement`)).body;
  assert.equal(found.rows.length, 1);
});

test('supplier statement mirrors the rules (Credit = purchase, Debit = payment)', async () => {
  const s = (await get(`/api/ledger/suppliers/${ids['ABC Traders']}`)).body;
  assert.deepEqual(s.rows.map((r) => [r.voucherNo, r.credit, r.debit, r.closing.amount, r.accountName]), [
    ['PUR-1025', 12000, 0, 12000, 'Purchase A/c'],
    ['SAL-2041', 0, 5000, 7000, 'Cash A/c'],
  ]);
  assert.equal(s.normalSide, 'credit');
});

test('a party can only be opened in its own ledger', async () => {
  assert.equal((await get(`/api/ledger/customers/${ids['ABC Traders']}`)).status, 404);
  assert.equal((await get(`/api/ledger/suppliers/${ids['XYZ Store']}`)).status, 404);
});

test('opening balance flows into summary and statement', async () => {
  const p = await post('/api/parties', { name: 'Opening Co', phone: '9999999999', type: 'customer', openingBalance: 5000 });
  assert.equal(p.status, 201);
  assert.equal((await post('/api/parties', { name: 'opening co', type: 'customer' })).status, 409); // duplicate (case-insensitive)
  const same = await post('/api/parties', { name: 'Opening Co', type: 'supplier' }); // same name, other ledger is fine
  assert.equal(same.status, 201);
  await post('/api/transactions', { type: 'debit', partyId: p.body.id, date: '2026-11-03', items: [{ itemId: ids['Cement'], qty: 2, rate: 500 }] });
  const s = (await get(`/api/ledger/customers/${p.body.id}`)).body;
  assert.equal(s.opening.amount, 5000);
  assert.equal(s.closing.amount, 6000);
});

test('stock recomputed from the full history equals stored stock', async () => {
  const r = (await get('/api/stock/reconcile')).body;
  assert.equal(r.ok, true, JSON.stringify(r.items.filter((i) => !i.ok)));
});
