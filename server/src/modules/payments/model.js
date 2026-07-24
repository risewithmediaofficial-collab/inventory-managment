import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true },
    type: { type: String, enum: ['received', 'made'], required: true },
    party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyType' },
    partyType: { type: String, enum: ['Customer', 'Supplier'], required: true },
    partyName: String,

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'dd', 'credit_card', 'debit_card', 'other'],
      required: true,
    },
    referenceNumber: String, // cheque no, UPI ref, etc.
    bankAccount: String,

    allocations: [
      {
        reference: { type: mongoose.Schema.Types.ObjectId },
        referenceType: { type: String, enum: ['Sale', 'Purchase'] },
        referenceNumber: String,
        amount: Number,
      },
    ],

    notes: String,
    attachment: String,
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'bounced'], default: 'completed' },

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ companyId: 1, type: 1 });
paymentSchema.index({ party: 1, partyType: 1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
