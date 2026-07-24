import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    logo: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    website: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },
    gstin: { type: String, uppercase: true },
    pan: { type: String, uppercase: true },
    cin: { type: String },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    financialYearStart: { type: String, default: 'April' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    taxType: { type: String, enum: ['GST', 'VAT', 'NONE'], default: 'GST' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    settings: {
      lowStockThreshold: { type: Number, default: 10 },
      autoBackup: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      invoicePrefix: { type: String, default: 'INV' },
      purchasePrefix: { type: String, default: 'PO' },
      quotationPrefix: { type: String, default: 'QT' },
    },
  },
  { timestamps: true }
);

const Company = mongoose.model('Company', companySchema);
export default Company;
