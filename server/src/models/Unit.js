import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortName: { type: String, required: true, trim: true },
}, { timestamps: true });
unitSchema.index({ name: 1 }, { unique: true });
unitSchema.set('toJSON', { transform: (_d, r) => { r.id = String(r._id); delete r._id; delete r.__v; return r; } });
export default mongoose.model('Unit', unitSchema);
