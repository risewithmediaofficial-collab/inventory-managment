import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, sparse: true },
    type: { type: String, enum: ['individual', 'business'], default: 'individual' },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    alternatePhone: { type: String },
    gstin: { type: String, uppercase: true },
    pan: { type: String, uppercase: true },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    contactPerson: { type: String },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'custom'],
      default: 'immediate',
    },
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    priceGroup: { type: String, enum: ['retail', 'wholesale', 'vip'], default: 'retail' },
    notes: { type: String },
    tags: [String],
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', email: 'text', phone: 'text', gstin: 'text' });
customerSchema.index({ companyId: 1, isActive: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
