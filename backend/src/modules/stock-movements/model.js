import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    movementNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: [
        'purchase', 'purchase_return', 'sale', 'sale_return',
        'transfer_in', 'transfer_out', 'adjustment', 'damage',
        'expiry', 'opening_stock', 'found', 'lost',
      ],
      required: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, default: 0 },
    newStock: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    batchNumber: String,
    expiryDate: Date,
    referenceType: { type: String, enum: ['Purchase', 'Sale', 'Transfer', 'Adjustment', 'Manual'] },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceNumber: String,
    reason: String,
    notes: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ companyId: 1, type: 1 });
stockMovementSchema.index({ warehouse: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;
