import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  sku: String,
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  batchNumber: String,
  expiryDate: Date,
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: ['purchase_order', 'purchase_invoice', 'goods_received', 'purchase_return'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partial', 'received', 'invoiced', 'cancelled', 'returned'],
      default: 'draft',
    },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierInvoiceNumber: String,
    purchaseDate: { type: Date, default: Date.now },
    expectedDeliveryDate: Date,
    deliveryDate: Date,
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    items: [purchaseItemSchema],

    // Totals
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overdue'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'upi', 'cheque', 'credit', 'other'] },
    dueDate: Date,

    notes: String,
    terms: String,
    attachment: String,

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Reference to original PO for invoices
    referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },

    isStockUpdated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

purchaseSchema.index({ companyId: 1, type: 1, status: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ purchaseNumber: 'text' });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
