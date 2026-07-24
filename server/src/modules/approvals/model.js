import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ['PurchaseOrder', 'StockAdjustment', 'SalesReturn', 'BranchTransfer', 'Discount', 'PriceChange'],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referenceNumber: { type: String, default: '' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reason: { type: String, required: true },
    approvalComments: { type: String, default: '' },
    payload: { type: Object, default: {} }, // Snapshot of requested changes
  },
  { timestamps: true }
);

const Approval = mongoose.model('Approval', approvalSchema);
export default Approval;
