import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    gstin: { type: String, default: '' },
    isHeadOffice: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  },
  { timestamps: true }
);

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
