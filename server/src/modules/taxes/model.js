import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['GST', 'IGST', 'CGST', 'SGST', 'VAT', 'CESS', 'NONE'], default: 'GST' },
    rate: { type: Number, required: true, min: 0, max: 100 },
    components: [
      {
        name: String,
        rate: Number,
      },
    ],
    hsnCode: { type: String },
    description: { type: String },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Tax = mongoose.model('Tax', taxSchema);
export default Tax;
