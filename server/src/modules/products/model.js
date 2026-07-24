import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, trim: true },
    barcode: { type: String, unique: true, sparse: true },
    slug: { type: String, lowercase: true },
    description: { type: String },
    shortDescription: { type: String },
    images: [{ type: String }],
    thumbnail: { type: String },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    tax: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },

    // Pricing
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    wholesalePrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    taxIncluded: { type: Boolean, default: false },

    // Stock
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 0 },
    maxStockLevel: { type: Number },
    reorderPoint: { type: Number, default: 0 },

    // Warehouse stock
    warehouseStock: [
      {
        warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
        quantity: { type: Number, default: 0 },
        location: String,
      },
    ],

    // Physical
    weight: { type: Number },
    weightUnit: { type: String, default: 'kg' },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' },
    },

    // Tracking
    expiryTracking: { type: Boolean, default: false },
    batchTracking: { type: Boolean, default: false },
    serialTracking: { type: Boolean, default: false },

    type: {
      type: String,
      enum: ['product', 'service', 'combo', 'raw_material'],
      default: 'product',
    },

    tags: [String],
    notes: String,

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: profit margin
productSchema.virtual('profitMargin').get(function () {
  if (!this.purchasePrice || this.purchasePrice === 0) return 0;
  return (((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100).toFixed(2);
});

// Virtual: stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockLevel) return 'low_stock';
  return 'in_stock';
});

// Auto-generate SKU
productSchema.pre('save', async function (next) {
  if (!this.sku) {
    const count = await mongoose.model('Product').countDocuments({ companyId: this.companyId });
    this.sku = `SKU-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

productSchema.index({ name: 'text', sku: 'text', barcode: 'text', tags: 'text' });
productSchema.index({ companyId: 1, isActive: 1 });
productSchema.index({ category: 1 });
productSchema.index({ currentStock: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
