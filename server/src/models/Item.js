import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  code: { type: String, default: '', trim: true },
  name: { type: String, required: true, trim: true, unique: true },
  unit: { type: String, required: true, trim: true },
  price: { type: Number, default: 0 }, // legacy default rate suggested on entry forms
  purchaseRate: { type: Number, default: 0 },
  saleRate: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  stock: { type: Number, default: 0 }, // current stock, changed only by purchase (+) and debit entry (-)
});

itemSchema.set('toJSON', {
  transform: (_d, r) => {
    r.id = String(r._id);
    delete r._id;
    delete r.__v;
    return r;
  },
});

export default mongoose.model('Item', itemSchema);
