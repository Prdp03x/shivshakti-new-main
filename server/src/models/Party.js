import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameKey: { type: String, required: true }, // lower-case name: unique per party type
  phone: { type: String, default: '', trim: true },
  type: { type: String, enum: ['customer', 'supplier'], required: true },
  // Opening balance in rupees; positive = on the ledger's normal side
  // (supplier: payable / Cr, customer: receivable / Dr).
  openingBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

partySchema.index({ type: 1, nameKey: 1 }, { unique: true });

partySchema.pre('validate', function (next) {
  if (this.name) this.nameKey = this.name.trim().toLowerCase();
  next();
});

partySchema.set('toJSON', {
  transform: (_d, r) => {
    r.id = String(r._id);
    delete r._id;
    delete r.__v;
    delete r.nameKey;
    return r;
  },
});

export default mongoose.model('Party', partySchema);
