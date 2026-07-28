import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['weight', 'volume', 'length', 'area', 'piece', 'time', 'other'],
      default: 'piece',
    },
    baseUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    conversionFactor: { type: Number, default: 1 },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Unit = mongoose.model('Unit', unitSchema);
export default Unit;
