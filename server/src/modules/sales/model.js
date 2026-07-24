import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
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
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: ['quotation', 'sales_order', 'invoice', 'sales_return', 'delivery_challan'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'draft',
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    saleDate: { type: Date, default: Date.now },
    validUntil: Date, // for quotations
    expectedDeliveryDate: Date,
    deliveryDate: Date,
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    items: [saleItemSchema],

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

    billingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    terms: String,
    attachment: String,

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Reference to original quotation/order for invoices
    referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },

    isStockUpdated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

saleSchema.index({ companyId: 1, type: 1, status: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ invoiceNumber: 'text' });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
