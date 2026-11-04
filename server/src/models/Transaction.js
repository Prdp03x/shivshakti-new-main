import mongoose from 'mongoose';
import { TX_TYPES } from '../accounting/rules.js';

const lineSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: String,
    unit: String,
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: TX_TYPES, required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  partyType: { type: String, enum: ['customer', 'supplier'], required: true },
  partyName: { type: String, required: true }, // snapshot for listings
  date: { type: String, required: true }, // YYYY-MM-DD (business date)
  voucherNo: { type: String, required: true },
  items: { type: [lineSchema], default: [] }, // purchase / debit entry only
  paymentMode: { type: String }, // sale / credit entry only
  accountName: { type: String, required: true },
  notes: { type: String, default: '' },
  amount: { type: Number, required: true },
  ledgerSide: { type: String, enum: ['debit', 'credit'], required: true },
  stockEffect: { type: String, enum: ['increase', 'decrease', 'none'], required: true },
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.index({ type: 1, voucherNo: 1 }, { unique: true });
transactionSchema.index({ partyId: 1, date: 1 });

transactionSchema.set('toJSON', {
  transform: (_d, r) => {
    r.id = String(r._id);
    r.partyId = String(r.partyId);
    delete r._id;
    delete r.__v;
    return r;
  },
});

export default mongoose.model('Transaction', transactionSchema);
