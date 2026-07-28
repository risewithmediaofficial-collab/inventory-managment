/**
 * Inserts demo records for end-to-end testing (POS, sales, purchases, inventory).
 * Safe to re-run: skips if DEMO10 batch already exists (use --force to replace).
 *
 * NOTE: Bypasses service layer (no Mongo sessions/transactions) so it works
 *       on a standalone MongoDB instance without replica-set support.
 *
 * Usage: node src/seedFakeData.js [--force]
 * Login: admin@demo.com / Admin@123  (from seed.js)
 */

import connectDB from './config/database.js';
import logger from './config/logger.js';
import { seedDatabase } from './seed.js';
import User from './modules/users/model.js';
import Company from './modules/settings/model.js';
import Category from './modules/categories/model.js';
import Brand from './modules/brands/model.js';
import Unit from './modules/units/model.js';
import Warehouse from './modules/warehouses/model.js';
import Tax from './modules/taxes/model.js';
import Product from './modules/products/model.js';
import Customer from './modules/customers/model.js';
import Supplier from './modules/suppliers/model.js';
import Branch from './modules/branches/model.js';
import Sale from './modules/sales/model.js';
import Purchase from './modules/purchases/model.js';
import StockMovement from './modules/stock-movements/model.js';

const BATCH      = 'demo-10';
const SKU_PREFIX = 'DEMO10';

const DEMO_PRODUCTS = [
  { name: 'OPC Cement 50kg Bag',          sku: `${SKU_PREFIX}-001`, barcode: '890100100101', sell: 420,  cost: 360,  stock: 120, min: 20  },
  { name: 'TMT Steel Rod 12mm',            sku: `${SKU_PREFIX}-002`, barcode: '890100100102', sell: 68,   cost: 58,   stock: 500, min: 50  },
  { name: 'PVC Pipe 2 inch (3m)',          sku: `${SKU_PREFIX}-003`, barcode: '890100100103', sell: 285,  cost: 210,  stock: 85,  min: 15  },
  { name: 'Wall Putty 20kg',              sku: `${SKU_PREFIX}-004`, barcode: '890100100104', sell: 890,  cost: 720,  stock: 40,  min: 8   },
  { name: 'Interior Emulsion Paint 10L',  sku: `${SKU_PREFIX}-005`, barcode: '890100100105', sell: 2450, cost: 1980, stock: 32,  min: 6   },
  { name: 'Ceramic Floor Tile 2x2 ft',    sku: `${SKU_PREFIX}-006`, barcode: '890100100106', sell: 38,   cost: 28,   stock: 800, min: 100 },
  { name: 'Copper Wire 1.5 sq mm (90m)',  sku: `${SKU_PREFIX}-007`, barcode: '890100100107', sell: 1650, cost: 1420, stock: 25,  min: 5   },
  { name: 'Door Handle Set (SS)',          sku: `${SKU_PREFIX}-008`, barcode: '890100100108', sell: 450,  cost: 320,  stock: 3,   min: 10  },
  { name: 'White Portland Cement 50kg',   sku: `${SKU_PREFIX}-009`, barcode: '890100100109', sell: 480,  cost: 410,  stock: 60,  min: 12  },
  { name: 'Waterproofing Compound 5L',    sku: `${SKU_PREFIX}-010`, barcode: '890100100110', sell: 720,  cost: 580,  stock: 18,  min: 4   },
];

const DEMO_CUSTOMERS = [
  { code: 'DEMO-C01', name: 'Sharma Builders Pvt Ltd',  phone: '9811000001', email: 'sharma@builders.demo', city: 'Delhi'     },
  { code: 'DEMO-C02', name: 'Green Valley Contractors', phone: '9811000002', email: 'green@valley.demo',    city: 'Gurgaon'   },
  { code: 'DEMO-C03', name: 'Metro Interiors',          phone: '9811000003', email: 'metro@interiors.demo', city: 'Noida'     },
  { code: 'DEMO-C04', name: 'Ravi Hardware Store',      phone: '9811000004', email: 'ravi@hardware.demo',   city: 'Faridabad' },
  { code: 'DEMO-C05', name: 'Sunrise Developers',       phone: '9811000005', email: 'sunrise@dev.demo',     city: 'Ghaziabad' },
];

const DEMO_SUPPLIERS = [
  { code: 'DEMO-S01', name: 'National Cement Distributors', phone: '9822000001', email: 'cement@national.demo' },
  { code: 'DEMO-S02', name: 'Steel India Traders',          phone: '9822000002', email: 'steel@india.demo'     },
  { code: 'DEMO-S03', name: 'Aqua Pipes & Fittings',        phone: '9822000003', email: 'aqua@pipes.demo'      },
  { code: 'DEMO-S04', name: 'ColorMax Paints Wholesale',    phone: '9822000004', email: 'colormax@demo'        },
  { code: 'DEMO-S05', name: 'ElectroMart Supplies',         phone: '9822000005', email: 'electro@mart.demo'    },
];

// ── helpers ────────────────────────────────────────────────────────────────

function calcItem(product, qty, price, discPct, taxRate) {
  const discountAmount = (price * qty * discPct) / 100;
  const subtotal       = price * qty - discountAmount;
  const taxAmount      = (subtotal * taxRate) / 100;
  const total          = subtotal + taxAmount;
  return {
    product:      product._id,
    productName:  product.name,
    sku:          product.sku,
    quantity:     qty,
    unitPrice:    price,
    discount:     discPct,
    discountType: 'percent',
    taxRate,
    taxAmount,
    subtotal,
    total,
  };
}

function calcTotals(items, shippingAmount = 0, paidAmount = 0) {
  const subtotal      = items.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount     = items.reduce((s, i) => s + i.taxAmount, 0);
  const totalAmount   = subtotal + taxAmount + shippingAmount;
  const dueAmount     = totalAmount - paidAmount;
  const paymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= totalAmount ? 'paid' : 'partial';
  return { subtotal, taxAmount, totalAmount, paidAmount, dueAmount, paymentStatus };
}

// ── number generators ──────────────────────────────────────────────────────

let _movementCounter = null;
async function nextMovementNumber() {
  if (_movementCounter === null) {
    _movementCounter = await StockMovement.countDocuments();
  }
  _movementCounter += 1;
  return `SM-${String(_movementCounter).padStart(6, '0')}`;
}

async function nextInvoiceNumber(companyId, type) {
  const prefixMap = { quotation: 'QT', sales_order: 'SO', invoice: 'INV', sales_return: 'SR', delivery_challan: 'DC' };
  const prefix    = prefixMap[type] || 'INV';
  const count     = await Sale.countDocuments({ companyId, type });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
}

async function nextPurchaseNumber(companyId, type) {
  const prefixMap = { purchase_order: 'PO', purchase_invoice: 'PI', goods_received: 'GRN', purchase_return: 'PR' };
  const prefix    = prefixMap[type] || 'PI';
  const count     = await Purchase.countDocuments({ companyId, type });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
}

// ── context & master data ──────────────────────────────────────────────────

async function getContext() {
  await seedDatabase();
  const admin = await User.findOne({ email: 'admin@demo.com' }).select('+password');
  if (!admin) throw new Error('Admin user not found. Run: node src/seed.js --run');
  const company = await Company.findById(admin.companyId);
  if (!company) throw new Error('Company not found for admin user.');
  return { admin, companyId: company._id };
}

async function ensureMasters(companyId, adminId) {
  let category = await Category.findOne({ companyId, slug: 'building-materials' });
  if (!category) {
    category = await Category.create({ name: 'Building Materials', slug: 'building-materials', companyId, createdBy: adminId });
  }

  let brand = await Brand.findOne({ companyId, slug: 'mk-generic' });
  if (!brand) {
    brand = await Brand.create({ name: 'MK Generic', slug: 'mk-generic', companyId, createdBy: adminId });
  }

  let unit = await Unit.findOne({ companyId, symbol: 'pcs' });
  if (!unit) {
    unit = await Unit.create({ name: 'Piece', symbol: 'pcs', type: 'piece', companyId, createdBy: adminId });
  }

  let tax = await Tax.findOne({ companyId, rate: 18 });
  if (!tax) {
    tax = await Tax.create({ name: 'GST 18%', rate: 18, type: 'GST', companyId, createdBy: adminId });
  }

  let warehouse = await Warehouse.findOne({ companyId, isDefault: true });
  if (!warehouse) {
    warehouse = await Warehouse.create({ name: 'Main Godown', code: 'GDN-MAIN', isDefault: true, companyId, createdBy: adminId });
  }

  let branch = await Branch.findOne({ code: 'HQ-DEMO' });
  if (!branch) {
    branch = await Branch.create({
      name: 'Head Office — Demo', code: 'HQ-DEMO', phone: '+91 9876543210',
      isHeadOffice: true, status: 'active',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      warehouse: warehouse._id,
    });
  }

  return { category, brand, unit, tax, warehouse, branch };
}

// ── clear old batch ────────────────────────────────────────────────────────

async function clearDemoBatch(companyId) {
  const demoSkus       = DEMO_PRODUCTS.map((p) => p.sku);
  const demoProductIds = (
    await Product.find({ companyId, sku: { $in: demoSkus } }).select('_id')
  ).map((p) => p._id);

  await Sale.deleteMany({ companyId, notes: BATCH });
  await Purchase.deleteMany({ companyId, notes: BATCH });
  if (demoProductIds.length) {
    await StockMovement.deleteMany({ product: { $in: demoProductIds } });
  }
  await Product.deleteMany({ companyId, sku: { $in: demoSkus } });
  await Customer.deleteMany({ companyId, code: { $regex: /^DEMO-C/ } });
  await Supplier.deleteMany({ companyId, code: { $regex: /^DEMO-S/ } });

  if (demoProductIds.length) {
    logger.info(`Removed previous ${BATCH} batch (${demoProductIds.length} products).`);
  }
}

// ── stock movement helper ──────────────────────────────────────────────────

async function addStockMovement({ type, product, warehouse, qty, prev, unitCost, totalCost, refType, refId, refNumber, companyId, createdBy }) {
  const newStock = type === 'sale' ? prev - qty : prev + qty;
  await StockMovement.create({
    movementNumber: await nextMovementNumber(),
    type,
    product,
    warehouse,
    quantity:      qty,
    previousStock: prev,
    newStock,
    unitCost,
    totalCost,
    referenceType:   refType,
    referenceId:     refId,
    referenceNumber: refNumber,
    companyId,
    createdBy,
  });
  return newStock;
}

// ── main seeder ────────────────────────────────────────────────────────────

export async function seedFakeDemoData({ force = false } = {}) {
  const { admin, companyId } = await getContext();
  const masters              = await ensureMasters(companyId, admin._id);

  const existing = await Product.countDocuments({ companyId, sku: { $regex: new RegExp(`^${SKU_PREFIX}-`) } });

  if (existing >= 10 && !force) {
    logger.info(`Demo batch "${BATCH}" already present (${existing} products). Use --force to refresh.`);
    return { skipped: true, existing };
  }

  if (force && existing > 0) {
    await clearDemoBatch(companyId);
  }

  // Reset in-memory movement counter after clearing
  _movementCounter = null;

  // ── 1. Products ──────────────────────────────────────────────────────────
  const products = await Product.insertMany(
    DEMO_PRODUCTS.map((p) => ({
      name:           p.name,
      sku:            p.sku,
      barcode:        p.barcode,
      category:       masters.category._id,
      brand:          masters.brand._id,
      unit:           masters.unit._id,
      tax:            masters.tax._id,
      sellingPrice:   p.sell,
      purchasePrice:  p.cost,
      mrp:            Math.round(p.sell * 1.08),
      currentStock:   p.stock,
      openingStock:   p.stock,
      minStockLevel:  p.min,
      warehouse:      masters.warehouse._id,
      warehouseStock: [{ warehouse: masters.warehouse._id, quantity: p.stock }],
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
      type:           'product',
    }))
  );

  // ── 2. Customers ─────────────────────────────────────────────────────────
  const customers = await Customer.insertMany(
    DEMO_CUSTOMERS.map((c) => ({
      ...c,
      type:      'business',
      address:   { city: c.city, state: 'Delhi NCR', country: 'India' },
      companyId,
      createdBy: admin._id,
    }))
  );

  // ── 3. Suppliers ─────────────────────────────────────────────────────────
  const suppliers = await Supplier.insertMany(
    DEMO_SUPPLIERS.map((s) => ({ ...s, companyId, createdBy: admin._id }))
  );

  const [p1, p2, p3, p4, p5] = products;
  const [c1, c2, c3, c4]     = customers;
  const [s1, s2]              = suppliers;
  const wh                    = masters.warehouse._id;

  // ── 4. Sales ─────────────────────────────────────────────────────────────

  // Sale 1 — Draft Quotation (no stock change)
  {
    const items  = [calcItem(p1, 10, p1.sellingPrice, 0, 18)];
    const totals = calcTotals(items, 0, 0);
    await Sale.create({
      invoiceNumber: await nextInvoiceNumber(companyId, 'quotation'),
      type:          'quotation',
      status:        'draft',
      customer:      c1._id,
      warehouse:     wh,
      saleDate:      new Date(Date.now() - 7 * 86400000),
      items,
      ...totals,
      companyId,
      createdBy:     admin._id,
      notes:         BATCH,
    });
  }

  // Sale 2 — Confirmed Invoice (partial payment, UPI)
  {
    const items  = [
      calcItem(p2, 5, p2.sellingPrice, 5,  18),
      calcItem(p3, 2, p3.sellingPrice, 0,  18),
    ];
    const totals = calcTotals(items, 150, 5000);
    const inv = await Sale.create({
      invoiceNumber:  await nextInvoiceNumber(companyId, 'invoice'),
      type:           'invoice',
      status:         'confirmed',
      customer:       c2._id,
      warehouse:      wh,
      saleDate:       new Date(Date.now() - 5 * 86400000),
      items,
      shippingAmount: 150,
      paymentMethod:  'upi',
      ...totals,
      isStockUpdated: true,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
    for (const item of items) {
      const prod = await Product.findById(item.product);
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
      await addStockMovement({ type: 'sale', product: item.product, warehouse: wh, qty: item.quantity, prev: prod.currentStock, unitCost: item.unitPrice, totalCost: item.total, refType: 'Sale', refId: inv._id, refNumber: inv.invoiceNumber, companyId, createdBy: admin._id });
    }
  }

  // Sale 3 — Fully Paid Invoice (cash, delivered, yesterday)
  {
    const items   = [calcItem(p4, 3, p4.sellingPrice, 10, 18)];
    const paidAmt = Math.round(calcTotals(items).totalAmount);
    const totals  = calcTotals(items, 0, paidAmt);
    const inv = await Sale.create({
      invoiceNumber:  await nextInvoiceNumber(companyId, 'invoice'),
      type:           'invoice',
      status:         'delivered',
      customer:       c3._id,
      warehouse:      wh,
      saleDate:       new Date(Date.now() - 86400000),
      items,
      paymentMethod:  'cash',
      ...totals,
      isStockUpdated: true,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
    for (const item of items) {
      const prod = await Product.findById(item.product);
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
      await addStockMovement({ type: 'sale', product: item.product, warehouse: wh, qty: item.quantity, prev: prod.currentStock, unitCost: item.unitPrice, totalCost: item.total, refType: 'Sale', refId: inv._id, refNumber: inv.invoiceNumber, companyId, createdBy: admin._id });
    }
  }

  // Sale 4 — Partial Payment Invoice (bank, today, 2 line items)
  {
    const items  = [
      calcItem(p1, 20, p1.sellingPrice, 0, 18),
      calcItem(p5, 4,  p5.sellingPrice, 5, 18),
    ];
    const totals = calcTotals(items, 0, 10000);
    const inv = await Sale.create({
      invoiceNumber:  await nextInvoiceNumber(companyId, 'invoice'),
      type:           'invoice',
      status:         'confirmed',
      customer:       c4._id,
      warehouse:      wh,
      saleDate:       new Date(),
      items,
      paymentMethod:  'bank',
      ...totals,
      isStockUpdated: true,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
    for (const item of items) {
      const prod = await Product.findById(item.product);
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
      await addStockMovement({ type: 'sale', product: item.product, warehouse: wh, qty: item.quantity, prev: prod.currentStock, unitCost: item.unitPrice, totalCost: item.total, refType: 'Sale', refId: inv._id, refNumber: inv.invoiceNumber, companyId, createdBy: admin._id });
    }
  }

  // Sale 5 — Sales Order (pending fulfilment, no stock change)
  {
    const items  = [calcItem(p3, 15, p3.sellingPrice, 0, 18)];
    const totals = calcTotals(items, 0, 0);
    await Sale.create({
      invoiceNumber: await nextInvoiceNumber(companyId, 'sales_order'),
      type:          'sales_order',
      status:        'confirmed',
      customer:      c1._id,
      warehouse:     wh,
      saleDate:      new Date(Date.now() - 2 * 86400000),
      items,
      ...totals,
      companyId,
      createdBy:     admin._id,
      notes:         BATCH,
    });
  }

  // ── 5. Purchases ──────────────────────────────────────────────────────────

  // Purchase 1 — Received Invoice (stock increases for p1)
  {
    const items  = [calcItem(p1, 50, p1.purchasePrice, 0, 18)];
    const totals = calcTotals(items, 0, 0);
    const po = await Purchase.create({
      purchaseNumber: await nextPurchaseNumber(companyId, 'purchase_invoice'),
      type:           'purchase_invoice',
      status:         'received',
      supplier:       s1._id,
      warehouse:      wh,
      purchaseDate:   new Date(Date.now() - 3 * 86400000),
      items,
      ...totals,
      isStockUpdated: true,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
    for (const item of items) {
      const prod = await Product.findById(item.product);
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
      await addStockMovement({ type: 'purchase', product: item.product, warehouse: wh, qty: item.quantity, prev: prod.currentStock, unitCost: item.unitPrice, totalCost: item.total, refType: 'Purchase', refId: po._id, refNumber: po.purchaseNumber, companyId, createdBy: admin._id });
    }
  }

  // Purchase 2 — Purchase Order (ordered, no stock change)
  {
    const items  = [
      calcItem(p2, 100, p2.purchasePrice, 0, 18),
      calcItem(p3, 30,  p3.purchasePrice, 2, 18),
    ];
    const totals = calcTotals(items, 0, 0);
    await Purchase.create({
      purchaseNumber: await nextPurchaseNumber(companyId, 'purchase_order'),
      type:           'purchase_order',
      status:         'ordered',
      supplier:       s2._id,
      warehouse:      wh,
      purchaseDate:   new Date(Date.now() - 86400000),
      items,
      ...totals,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
  }

  // Purchase 3 — Received Invoice (stock increases for p5)
  {
    const items  = [calcItem(p5, 20, p5.purchasePrice, 3, 18)];
    const totals = calcTotals(items, 0, 0);
    const po = await Purchase.create({
      purchaseNumber: await nextPurchaseNumber(companyId, 'purchase_invoice'),
      type:           'purchase_invoice',
      status:         'received',
      supplier:       s1._id,
      warehouse:      wh,
      purchaseDate:   new Date(),
      items,
      ...totals,
      isStockUpdated: true,
      companyId,
      createdBy:      admin._id,
      notes:          BATCH,
    });
    for (const item of items) {
      const prod = await Product.findById(item.product);
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
      await addStockMovement({ type: 'purchase', product: item.product, warehouse: wh, qty: item.quantity, prev: prod.currentStock, unitCost: item.unitPrice, totalCost: item.total, refType: 'Purchase', refId: po._id, refNumber: po.purchaseNumber, companyId, createdBy: admin._id });
    }
  }

  // ── done ──────────────────────────────────────────────────────────────────
  logger.info('✅ Demo data seeded successfully!');
  logger.info(`   • ${products.length} products  (SKU prefix ${SKU_PREFIX}-*)`);
  logger.info(`   • ${customers.length} customers (DEMO-C01 … DEMO-C05)`);
  logger.info(`   • ${suppliers.length} suppliers (DEMO-S01 … DEMO-S05)`);
  logger.info('   • Sales: 3 invoices, 1 quotation, 1 sales order');
  logger.info('   • Purchases: 2 received invoices, 1 purchase order');
  logger.info('   Login: admin@demo.com / Admin@123');

  return {
    skipped:   false,
    products:  products.length,
    customers: customers.length,
    suppliers: suppliers.length,
  };
}

// ── CLI entry point ────────────────────────────────────────────────────────

const isMain = process.argv[1]?.includes('seedFakeData');
if (isMain) {
  const force = process.argv.includes('--force');
  connectDB()
    .then(() => seedFakeDemoData({ force }))
    .then((result) => {
      if (result.skipped) process.exit(0);
      process.exit(0);
    })
    .catch((err) => {
      logger.error(err.stack || err.message || err);
      process.exit(1);
    });
}
