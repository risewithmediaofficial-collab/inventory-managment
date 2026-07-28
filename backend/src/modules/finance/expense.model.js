import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Expense', 'Income'], default: 'Expense' },
    category: { type: String, required: true }, // e.g. Rent, Salary, Utilities, Logistics
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['cash', 'bank_transfer', 'upi', 'cheque'], default: 'cash' },
    date: { type: Date, default: Date.now },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    payeeOrPayer: { type: String, default: '' },
    description: { type: String, default: '' },
    attachments: [{ type: String }],
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
