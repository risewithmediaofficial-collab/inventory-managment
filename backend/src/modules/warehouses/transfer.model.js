import mongoose from 'mongoose';

const transferItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  batchNumber: String,
  quantity: { type: Number, required: true },
  binLocation: { type: String, default: '' },
});

const transferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true, unique: true },
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    fromBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    toBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    items: [transferItemSchema],
    status: {
      type: String,
      enum: ['requested', 'approved', 'dispatched', 'received', 'rejected'],
      default: 'requested',
    },
    dispatchDate: Date,
    receiveDate: Date,
    notes: String,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const WarehouseTransfer = mongoose.model('WarehouseTransfer', transferSchema);
export default WarehouseTransfer;
