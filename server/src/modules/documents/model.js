import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Invoice', 'PurchaseOrder', 'Warranty', 'GSTRegistration', 'SupplierAgreement', 'CustomerDoc', 'Other'],
      default: 'Other',
    },
    filePath: { type: String, required: true },
    fileSize: Number,
    mimeType: String,
    relatedModel: { type: String, enum: ['Customer', 'Supplier', 'Sale', 'Purchase', 'Product', 'Branch'] },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
