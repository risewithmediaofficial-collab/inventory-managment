import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    batchNumber: { type: String, required: true, trim: true },
    serialNumbers: [{ type: String }],
    mfgDate: { type: Date },
    expiryDate: { type: Date },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    status: { type: String, enum: ['active', 'expired', 'recalled'], default: 'active' },
  },
  { timestamps: true }
);

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
