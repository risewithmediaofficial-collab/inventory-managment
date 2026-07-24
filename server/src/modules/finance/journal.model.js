import mongoose from 'mongoose';

const journalItemSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  accountName: { type: String, default: '' },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  memo: { type: String, default: '' },
});

const journalEntrySchema = new mongoose.Schema(
  {
    entryNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    reference: { type: String, default: '' }, // e.g. INV-1001, PO-2002
    description: { type: String, required: true },
    items: [journalItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'posted'], default: 'posted' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
