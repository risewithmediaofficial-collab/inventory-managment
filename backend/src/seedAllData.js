/**
 * FULL DEMO SEED  —  covers every module for complete workflow testing.
 * Seeds data for ALL companies present in the database so any logged-in user sees full data.
 *
 * Usage:
 *   node src/seedAllData.js [--force]
 */

import connectDB from './config/database.js';
import logger    from './config/logger.js';
import bcrypt    from 'bcryptjs';

import User, { Role }  from './modules/users/model.js';
import Company         from './modules/settings/model.js';
import Category        from './modules/categories/model.js';
import Brand           from './modules/brands/model.js';
import Unit            from './modules/units/model.js';
import Tax             from './modules/taxes/model.js';
import Warehouse       from './modules/warehouses/model.js';
import Branch          from './modules/branches/model.js';
import Product         from './modules/products/model.js';
import Customer        from './modules/customers/model.js';
import Supplier        from './modules/suppliers/model.js';
import Sale            from './modules/sales/model.js';
import Purchase        from './modules/purchases/model.js';
import StockMovement   from './modules/stock-movements/model.js';
import Payment         from './modules/payments/model.js';
import Account         from './modules/finance/account.model.js';
import Expense         from './modules/finance/expense.model.js';
import JournalEntry    from './modules/finance/journal.model.js';
import Approval        from './modules/approvals/model.js';
import Notification    from './modules/notifications/model.js';

const BATCH = 'FULL-DEMO-v1';

// ─────────────────────────────────────────────────────────────────────────────
// Counters (in-memory, reset per company)
// ─────────────────────────────────────────────────────────────────────────────
let _smCount = 0;
let _saleCount   = {};
let _purchCount  = {};
let _payCount    = 0;
let _expCount    = 0;
let _jrnCount    = 0;

async function initCounters(companyId) {
  _smCount   = await StockMovement.countDocuments({ companyId });
  _payCount  = await Payment.countDocuments({ companyId });
  _expCount  = await Expense.countDocuments();
  _jrnCount  = await JournalEntry.countDocuments();
  for (const t of ['quotation','sales_order','invoice','sales_return','delivery_challan']) {
    _saleCount[t] = await Sale.countDocuments({ companyId, type: t });
  }
  for (const t of ['purchase_order','purchase_invoice','goods_received','purchase_return']) {
    _purchCount[t] = await Purchase.countDocuments({ companyId, type: t });
  }
}

function smNum(cTag)    { _smCount++;  return `SM-${cTag}-${String(_smCount).padStart(5,'0')}`; }
function invNum(t, cTag){ _saleCount[t] = (_saleCount[t]||0)+1; const p={quotation:'QT',sales_order:'SO',invoice:'INV',sales_return:'SR',delivery_challan:'DC'}; return `${p[t]||'INV'}-${cTag}-${String(_saleCount[t]).padStart(5,'0')}`; }
function poNum(t, cTag) { _purchCount[t]=(_purchCount[t]||0)+1; const p={purchase_order:'PO',purchase_invoice:'PI',goods_received:'GRN',purchase_return:'PR'}; return `${p[t]||'PI'}-${cTag}-${String(_purchCount[t]).padStart(5,'0')}`; }
function payNum(cTag)   { _payCount++;  return `PAY-${cTag}-${String(_payCount).padStart(5,'0')}`; }
function expNum(cTag)   { _expCount++;  return `EXP-${cTag}-${String(_expCount).padStart(5,'0')}`; }
function jrnNum(cTag)   { _jrnCount++;  return `JE-${cTag}-${String(_jrnCount).padStart(5,'0')}`; }

// ─────────────────────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────────────────────
function calcItem(product, qty, price, discPct, taxRate) {
  const discAmt   = (price * qty * discPct) / 100;
  const subtotal  = price * qty - discAmt;
  const taxAmount = (subtotal * taxRate) / 100;
  return { product: product._id, productName: product.name, sku: product.sku, quantity: qty, unitPrice: price, discount: discPct, discountType: 'percent', taxRate, taxAmount, subtotal, total: subtotal + taxAmount };
}
function totals(items, ship=0, paid=0, discAmt=0) {
  const sub  = items.reduce((s,i)=>s+i.subtotal,0);
  const tax  = items.reduce((s,i)=>s+i.taxAmount,0);
  const total= sub+tax+ship-discAmt;
  const due  = total-paid;
  const ps   = paid<=0?'unpaid': paid>=total?'paid':'partial';
  return { subtotal:sub, taxAmount:tax, totalAmount:total, paidAmount:paid, dueAmount:due, paymentStatus:ps, shippingAmount:ship, discountAmount:discAmt };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock-movement helper
// ─────────────────────────────────────────────────────────────────────────────
async function stockMove({ type, product, warehouse, qty, prev, unitCost, totalCost, refType, refId, refNumber, companyId, createdBy, cTag }) {
  const newStock = (type==='sale'||type==='transfer_out'||type==='adjustment') ? prev-qty : prev+qty;
  await StockMovement.create({ movementNumber: smNum(cTag), type, product, warehouse, quantity: qty, previousStock: prev, newStock, unitCost, totalCost, referenceType: refType, referenceId: refId, referenceNumber: refNumber, companyId, createdBy });
  return newStock;
}
async function deductStock(items, inv, wh, companyId, adminId, cTag) {
  for (const item of items) {
    const p = await Product.findById(item.product);
    await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
    await stockMove({ type:'sale', product:item.product, warehouse:wh, qty:item.quantity, prev:p.currentStock, unitCost:item.unitPrice, totalCost:item.total, refType:'Sale', refId:inv._id, refNumber:inv.invoiceNumber, companyId, createdBy:adminId, cTag });
  }
}
async function addStock(items, po, wh, companyId, adminId, cTag) {
  for (const item of items) {
    const p = await Product.findById(item.product);
    await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
    await stockMove({ type:'purchase', product:item.product, warehouse:wh, qty:item.quantity, prev:p.currentStock, unitCost:item.unitPrice, totalCost:item.total, refType:'Purchase', refId:po._id, refNumber:po.purchaseNumber, companyId, createdBy:adminId, cTag });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clear previous batch for a company
// ─────────────────────────────────────────────────────────────────────────────
async function clearBatch(companyId) {
  const prodIds = (await Product.find({ companyId }).select('_id')).map(p=>p._id);
  await Sale.deleteMany({ companyId });
  await Purchase.deleteMany({ companyId });
  if (prodIds.length) await StockMovement.deleteMany({ companyId });
  await Payment.deleteMany({ companyId });
  await Expense.deleteMany({ description: new RegExp(BATCH) });
  await JournalEntry.deleteMany({ description: new RegExp(BATCH) });
  await Approval.deleteMany({ referenceNumber: new RegExp('DEMO') });
  await Notification.deleteMany({ companyId });
  await Product.deleteMany({ companyId });
  await Customer.deleteMany({ companyId });
  await Supplier.deleteMany({ companyId });
  await Account.deleteMany({ code: new RegExp('^FD-') });
  await User.deleteMany({ companyId, email: new RegExp('@fulldemoseed\\.local') });
  logger.info(`Cleared previous batch for companyId: ${companyId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed a single company
// ─────────────────────────────────────────────────────────────────────────────
async function seedSingleCompany(company, adminUser, force) {
  const companyId = company._id;
  const cTag      = companyId.toString().slice(-4).toUpperCase();
  logger.info(`\n🚀 Seeding Company: "${company.name}" (ID: ${companyId}, Tag: ${cTag})`);

  const existingProd = await Product.countDocuments({ companyId, notes: BATCH });
  if (existingProd > 0 && !force) {
    logger.info(`   Batch "${BATCH}" already present for ${company.name} (${existingProd} products). Skipping (use --force to refresh).`);
    return;
  }
  if (force && existingProd > 0) {
    await clearBatch(companyId);
  }

  await initCounters(companyId);

  // 1. Roles
  const roleList = [
    { name: 'admin',             displayName: 'Admin',             permissions: ['*'] },
    { name: 'branch_manager',    displayName: 'Branch Manager',    permissions: ['sales.*','inventory.*','reports.*'] },
    { name: 'accountant',        displayName: 'Accountant',        permissions: ['finance.*','payments.*','reports.*'] },
    { name: 'sales_executive',   displayName: 'Sales Executive',   permissions: ['sales.*','customers.*'] },
    { name: 'warehouse_manager', displayName: 'Warehouse Manager', permissions: ['inventory.*','products.*'] },
    { name: 'purchase_manager',  displayName: 'Purchase Manager',  permissions: ['purchases.*','suppliers.*'] },
  ];
  const roles = {};
  for (const r of roleList) {
    let role = await Role.findOne({ name: r.name });
    if (!role) role = await Role.create({ ...r, description: `${r.displayName} role` });
    roles[r.name] = role;
  }

  // 2. Staff Users
  const staffTag = cTag.toLowerCase();
  const staffDefs = [
    { firstName:'Rahul',   lastName:'Sharma',  email:`rahul.${staffTag}@fulldemoseed.local`,  role:'branch_manager',    phone:'9900001001' },
    { firstName:'Priya',   lastName:'Patel',   email:`priya.${staffTag}@fulldemoseed.local`,   role:'accountant',        phone:'9900001002' },
    { firstName:'Arjun',   lastName:'Mehta',   email:`arjun.${staffTag}@fulldemoseed.local`,   role:'sales_executive',   phone:'9900001003' },
    { firstName:'Deepa',   lastName:'Nair',    email:`deepa.${staffTag}@fulldemoseed.local`,    role:'warehouse_manager', phone:'9900001004' },
    { firstName:'Vikram',  lastName:'Singh',   email:`vikram.${staffTag}@fulldemoseed.local`,  role:'purchase_manager',  phone:'9900001005' },
  ];
  const staffUsers = [];
  for (const u of staffDefs) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const hashed = await bcrypt.hash('Staff@123', 12);
      user = await User.create({ ...u, password: hashed, role: roles[u.role]._id, companyId, isActive: true, isApproved: true, approvalStatus: 'approved', isEmailVerified: true });
    }
    staffUsers.push(user);
  }
  const [rahul, priya, arjun, deepa, vikram] = staffUsers;

  // 3. Master Data
  const cats = {};
  for (const [rawSlug, name] of [
    ['building-materials','Building Materials'],
    ['paints-coatings','Paints & Coatings'],
    ['electrical','Electrical'],
    ['plumbing','Plumbing'],
    ['tools-hardware','Tools & Hardware'],
  ]) {
    const slug = `${rawSlug}-${cTag.toLowerCase()}`;
    let c = await Category.findOne({ companyId, slug });
    if (!c) c = await Category.create({ name, slug, companyId, createdBy: adminUser._id });
    cats[rawSlug] = c;
  }

  const brands = {};
  for (const [rawSlug, name] of [
    ['ultratech','UltraTech'],
    ['asian-paints','Asian Paints'],
    ['havells','Havells'],
    ['stanley','Stanley'],
  ]) {
    const slug = `${rawSlug}-${cTag.toLowerCase()}`;
    let b = await Brand.findOne({ companyId, slug });
    if (!b) b = await Brand.create({ name, slug, companyId, createdBy: adminUser._id });
    brands[rawSlug] = b;
  }

  const units = {};
  for (const [sym, name, type] of [
    ['pcs','Piece','piece'],
    ['kg','Kilogram','weight'],
    ['bag','Bag','piece'],
    ['mtr','Meter','length'],
    ['ltr','Litre','volume'],
    ['box','Box','piece'],
  ]) {
    let u = await Unit.findOne({ companyId, symbol: sym });
    if (!u) u = await Unit.create({ name, symbol: sym, type, companyId, createdBy: adminUser._id });
    units[sym] = u;
  }

  const taxes = {};
  for (const [rate, label] of [[5,'GST 5%'],[12,'GST 12%'],[18,'GST 18%'],[28,'GST 28%']]) {
    let t = await Tax.findOne({ companyId, rate });
    if (!t) t = await Tax.create({ name: `${label} (${cTag})`, rate, type:'GST', companyId, createdBy: adminUser._id });
    taxes[rate] = t;
  }

  // 4. Warehouses & Branches
  let wh1 = await Warehouse.findOne({ companyId, isDefault: true });
  if (!wh1) wh1 = await Warehouse.create({ name:'Main Warehouse', code:`WH-MAIN-${cTag}`, isDefault:true, companyId, createdBy:adminUser._id });
  let wh2 = await Warehouse.findOne({ companyId, code: `WH-STORE-${cTag}` });
  if (!wh2) wh2 = await Warehouse.create({ name:'Store Room', code:`WH-STORE-${cTag}`, isDefault:false, companyId, createdBy:adminUser._id });

  let br1 = await Branch.findOne({ code:`BR-HQ-${cTag}` });
  if (!br1) br1 = await Branch.create({ name:`${company.name} HQ`, code:`BR-HQ-${cTag}`, phone:'+91 9876543210', isHeadOffice:true, status:'active', address:{city:'Mumbai',state:'Maharashtra',country:'India'}, warehouse:wh1._id });

  const wh = wh1._id;

  // 5. Products (15)
  const prodDefs = [
    { name:'OPC Cement 50kg',           sku:`FD-P001-${cTag}`, barcode:`8910${cTag}01`, cat:'building-materials', brand:'ultratech',   unit:'bag', tax:18, sell:420,  cost:355,  stock:200, min:30 },
    { name:'TMT Steel Rod 12mm (6m)',    sku:`FD-P002-${cTag}`, barcode:`8910${cTag}02`, cat:'building-materials', brand:'ultratech',   unit:'pcs', tax:18, sell:72,   cost:60,   stock:600, min:60 },
    { name:'River Sand (per ton)',       sku:`FD-P003-${cTag}`, barcode:`8910${cTag}03`, cat:'building-materials', brand:'ultratech',   unit:'kg',  tax:5,  sell:1200, cost:900,  stock:50,  min:10 },
    { name:'Hollow Bricks (10 pcs)',     sku:`FD-P004-${cTag}`, barcode:`8910${cTag}04`, cat:'building-materials', brand:'ultratech',   unit:'box', tax:5,  sell:220,  cost:170,  stock:300, min:50 },
    { name:'Asian Paints Apex Ext 20L', sku:`FD-P005-${cTag}`, barcode:`8910${cTag}05`, cat:'paints-coatings',    brand:'asian-paints',unit:'pcs', tax:18, sell:3800, cost:3100, stock:25,  min:5 },
    { name:'Interior Emulsion 10L',     sku:`FD-P006-${cTag}`, barcode:`8910${cTag}06`, cat:'paints-coatings',    brand:'asian-paints',unit:'pcs', tax:18, sell:1950, cost:1550, stock:40,  min:8 },
    { name:'Primer (White) 20L',        sku:`FD-P007-${cTag}`, barcode:`8910${cTag}07`, cat:'paints-coatings',    brand:'asian-paints',unit:'pcs', tax:18, sell:1200, cost:950,  stock:18,  min:4 },
    { name:'Havells 1.5mm Wire (90m)',  sku:`FD-P008-${cTag}`, barcode:`8910${cTag}08`, cat:'electrical',         brand:'havells',     unit:'pcs', tax:18, sell:1650, cost:1380, stock:30,  min:5 },
    { name:'MCB 32A Single Pole',       sku:`FD-P009-${cTag}`, barcode:`8910${cTag}09`, cat:'electrical',         brand:'havells',     unit:'pcs', tax:18, sell:285,  cost:210,  stock:80,  min:15 },
    { name:'LED Bulb 12W (Pack of 10)', sku:`FD-P010-${cTag}`, barcode:`8910${cTag}10`, cat:'electrical',         brand:'havells',     unit:'box', tax:12, sell:680,  cost:490,  stock:60,  min:10 },
    { name:'CPVC Pipe 25mm (3m)',       sku:`FD-P011-${cTag}`, barcode:`8910${cTag}11`, cat:'plumbing',           brand:'stanley',     unit:'pcs', tax:18, sell:340,  cost:250,  stock:90,  min:20 },
    { name:'Ball Valve 1 inch',         sku:`FD-P012-${cTag}`, barcode:`8910${cTag}12`, cat:'plumbing',           brand:'stanley',     unit:'pcs', tax:18, sell:185,  cost:120,  stock:5,   min:15 },
    { name:'Stanley Hammer 500g',       sku:`FD-P013-${cTag}`, barcode:`8910${cTag}13`, cat:'tools-hardware',     brand:'stanley',     unit:'pcs', tax:18, sell:650,  cost:480,  stock:22,  min:5 },
    { name:'Drill Machine 13mm',        sku:`FD-P014-${cTag}`, barcode:`8910${cTag}14`, cat:'tools-hardware',     brand:'stanley',     unit:'pcs', tax:18, sell:3200, cost:2500, stock:8,   min:2 },
    { name:'Measuring Tape 5m',         sku:`FD-P015-${cTag}`, barcode:`8910${cTag}15`, cat:'tools-hardware',     brand:'stanley',     unit:'pcs', tax:18, sell:220,  cost:140,  stock:2,   min:10 },
  ];

  const products = await Product.insertMany(prodDefs.map(p=>({
    name: p.name, sku: p.sku, barcode: p.barcode,
    category: cats[p.cat]._id, brand: brands[p.brand]._id,
    unit: units[p.unit]._id, tax: taxes[p.tax]._id,
    sellingPrice: p.sell, purchasePrice: p.cost, mrp: Math.round(p.sell*1.1),
    currentStock: p.stock, openingStock: p.stock, minStockLevel: p.min,
    warehouse: wh1._id, warehouseStock:[{ warehouse:wh1._id, quantity:p.stock }],
    companyId, createdBy: adminUser._id, notes: BATCH, type:'product',
  })));
  const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15] = products;
  logger.info(`   ✔  ${products.length} products created`);

  // 6. Customers (8)
  const custDefs = [
    { code:`FD-C01-${cTag}`, name:'Sharma Builders Pvt Ltd',    phone:'9811100001', email:`sharma.${staffTag}@builders.demo`,   city:'Delhi',      gstin:'07AABCS1234K1Z5', type:'business', openBal:15000 },
    { code:`FD-C02-${cTag}`, name:'Green Valley Contractors',   phone:'9811100002', email:`green.${staffTag}@valley.demo`,      city:'Gurgaon',    gstin:'06AABCG5678K1Z2', type:'business', openBal:0 },
    { code:`FD-C03-${cTag}`, name:'Metro Interiors',            phone:'9811100003', email:`metro.${staffTag}@interiors.demo`,   city:'Noida',      gstin:'09AABCM9012K1Z8', type:'business', openBal:8000 },
    { code:`FD-C04-${cTag}`, name:'Ravi Hardware Store',        phone:'9811100004', email:`ravi.${staffTag}@hardware.demo`,     city:'Faridabad',  gstin:'',               type:'business', openBal:0 },
    { code:`FD-C05-${cTag}`, name:'Sunrise Developers',         phone:'9811100005', email:`sunrise.${staffTag}@dev.demo`,       city:'Ghaziabad',  gstin:'09AABCS3456K1Z4', type:'business', openBal:22000 },
    { code:`FD-C06-${cTag}`, name:'Aditya Kumar',               phone:'9811100006', email:`aditya.${staffTag}@personal.demo`,   city:'Mumbai',     gstin:'',               type:'individual', openBal:0 },
    { code:`FD-C07-${cTag}`, name:'BrightPath Infrastructure',  phone:'9811100007', email:`bright.${staffTag}@path.demo`,       city:'Pune',       gstin:'27AABCB7890K1Z1', type:'business', openBal:45000 },
    { code:`FD-C08-${cTag}`, name:'Cash / Walk-in Customer',    phone:'9999999999', email:'',                                   city:'',           gstin:'',               type:'individual', openBal:0 },
  ];
  const customers = await Customer.insertMany(custDefs.map(c=>({
    code:c.code, name:c.name, phone:c.phone, email:c.email||undefined,
    gstin:c.gstin||undefined, type:c.type,
    address:{city:c.city, state:'India', country:'India'},
    currentBalance: c.openBal,
    companyId, createdBy: adminUser._id, notes: BATCH,
  })));
  const [c1,c2,c3,c4,c5,c6,c7,c8] = customers;
  logger.info(`   ✔  ${customers.length} customers created`);

  // 7. Suppliers (6)
  const suppDefs = [
    { code:`FD-S01-${cTag}`, name:'National Cement Distributors', phone:'9822200001', email:`cement.${staffTag}@national.demo`,  gstin:'27AABCN1234K1Z3' },
    { code:`FD-S02-${cTag}`, name:'Steel India Traders',          phone:'9822200002', email:`steel.${staffTag}@india.demo`,       gstin:'27AABCS5678K1Z7' },
    { code:`FD-S03-${cTag}`, name:'ColorMax Paints Wholesale',   phone:'9822200003', email:`colormax.${staffTag}@demo`,          gstin:'27AABCC9012K1Z2' },
    { code:`FD-S04-${cTag}`, name:'Havells India Ltd',            phone:'9822200004', email:`havells.${staffTag}@supply.demo`,    gstin:'07AABCH3456K1Z9' },
    { code:`FD-S05-${cTag}`, name:'Aqua Pipes & Fittings',       phone:'9822200005', email:`aqua.${staffTag}@pipes.demo`,        gstin:'27AABCA7890K1Z6' },
    { code:`FD-S06-${cTag}`, name:'Stanley Tools Distributor',   phone:'9822200006', email:`stanley.${staffTag}@tools.demo`,     gstin:'27AABCS2345K1Z1' },
  ];
  const suppliers = await Supplier.insertMany(suppDefs.map(s=>({
    code:s.code, name:s.name, phone:s.phone, email:s.email, gstin:s.gstin,
    companyId, createdBy: adminUser._id, notes: BATCH,
  })));
  const [s1,s2,s3,s4,s5,s6] = suppliers;
  logger.info(`   ✔  ${suppliers.length} suppliers created`);

  // 8. Purchases (6)
  {
    const items = [calcItem(p1,100,p1.purchasePrice,0,18), calcItem(p2,200,p2.purchasePrice,2,18)];
    await Purchase.create({ purchaseNumber:poNum('purchase_order', cTag), type:'purchase_order', status:'ordered', supplier:s1._id, warehouse:wh, purchaseDate:new Date(Date.now()-10*86400000), items, ...totals(items), companyId, createdBy:vikram._id, notes:BATCH });
  }
  {
    const items = [calcItem(p5,15,p5.purchasePrice,0,18), calcItem(p6,20,p6.purchasePrice,0,18), calcItem(p7,10,p7.purchasePrice,0,18)];
    const po = await Purchase.create({ purchaseNumber:poNum('purchase_invoice', cTag), type:'purchase_invoice', status:'received', supplier:s3._id, warehouse:wh, purchaseDate:new Date(Date.now()-8*86400000), items, ...totals(items), isStockUpdated:true, companyId, createdBy:vikram._id, notes:BATCH });
    await addStock(items, po, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p8,20,p8.purchasePrice,0,18), calcItem(p9,50,p9.purchasePrice,0,18), calcItem(p10,30,p10.purchasePrice,0,18)];
    const po = await Purchase.create({ purchaseNumber:poNum('purchase_invoice', cTag), type:'purchase_invoice', status:'received', supplier:s4._id, warehouse:wh, purchaseDate:new Date(Date.now()-6*86400000), items, ...totals(items), isStockUpdated:true, companyId, createdBy:vikram._id, notes:BATCH });
    await addStock(items, po, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p11,50,p11.purchasePrice,0,18), calcItem(p12,20,p12.purchasePrice,0,18), calcItem(p13,15,p13.purchasePrice,0,18)];
    const po = await Purchase.create({ purchaseNumber:poNum('purchase_invoice', cTag), type:'purchase_invoice', status:'received', supplier:s5._id, warehouse:wh, purchaseDate:new Date(Date.now()-4*86400000), items, ...totals(items), isStockUpdated:true, companyId, createdBy:vikram._id, notes:BATCH });
    await addStock(items, po, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p1,80,p1.purchasePrice,3,18)];
    const t = totals(items);
    const po = await Purchase.create({ purchaseNumber:poNum('purchase_invoice', cTag), type:'purchase_invoice', status:'received', supplier:s1._id, warehouse:wh, purchaseDate:new Date(Date.now()-2*86400000), items, ...t, paidAmount:t.totalAmount, dueAmount:0, paymentStatus:'paid', isStockUpdated:true, companyId, createdBy:vikram._id, notes:BATCH });
    await addStock(items, po, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p14,5,p14.purchasePrice,0,18), calcItem(p15,20,p15.purchasePrice,0,18)];
    await Purchase.create({ purchaseNumber:poNum('purchase_order', cTag), type:'purchase_order', status:'draft', supplier:s6._id, warehouse:wh, purchaseDate:new Date(), items, ...totals(items), companyId, createdBy:vikram._id, notes:BATCH });
  }
  logger.info('   ✔  6 purchases created');

  // 9. Stock Adjustments
  {
    const prod = await Product.findById(p15._id);
    await Product.findByIdAndUpdate(p15._id, { $inc: { currentStock: 8 } });
    await StockMovement.create({ movementNumber:smNum(cTag), type:'adjustment', product:p15._id, warehouse:wh, quantity:8, previousStock:prod.currentStock, newStock:prod.currentStock+8, referenceType:'Adjustment', referenceNumber:`ADJ-${cTag}-001`, reason:'Physical count correction', companyId, createdBy:deepa._id });
  }
  {
    const prod = await Product.findById(p12._id);
    await Product.findByIdAndUpdate(p12._id, { $inc: { currentStock: -2 } });
    await StockMovement.create({ movementNumber:smNum(cTag), type:'damage', product:p12._id, warehouse:wh, quantity:2, previousStock:prod.currentStock, newStock:prod.currentStock-2, referenceType:'Adjustment', referenceNumber:`ADJ-${cTag}-002`, reason:'Damaged during storage', companyId, createdBy:deepa._id });
  }
  logger.info('   ✔  2 stock adjustments created');

  // 10. Sales (8)
  {
    const items = [calcItem(p1,50,p1.sellingPrice,0,18), calcItem(p2,100,p2.sellingPrice,0,18)];
    await Sale.create({ invoiceNumber:invNum('quotation', cTag), type:'quotation', status:'draft', customer:c7._id, warehouse:wh, saleDate:new Date(Date.now()-14*86400000), items, ...totals(items), companyId, createdBy:arjun._id, notes:BATCH });
  }
  {
    const items = [calcItem(p5,5,p5.sellingPrice,5,18), calcItem(p6,8,p6.sellingPrice,5,18)];
    await Sale.create({ invoiceNumber:invNum('quotation', cTag), type:'quotation', status:'confirmed', customer:c1._id, warehouse:wh, saleDate:new Date(Date.now()-10*86400000), validUntil:new Date(Date.now()+20*86400000), items, ...totals(items), companyId, createdBy:arjun._id, notes:BATCH });
  }
  {
    const items = [calcItem(p8,5,p8.sellingPrice,0,18), calcItem(p9,10,p9.sellingPrice,0,18)];
    await Sale.create({ invoiceNumber:invNum('sales_order', cTag), type:'sales_order', status:'confirmed', customer:c3._id, warehouse:wh, saleDate:new Date(Date.now()-7*86400000), items, ...totals(items), companyId, createdBy:arjun._id, notes:BATCH });
  }
  {
    const items = [calcItem(p1,20,p1.sellingPrice,0,18), calcItem(p4,30,p4.sellingPrice,0,18)];
    const t = totals(items,200,5000);
    const inv = await Sale.create({ invoiceNumber:invNum('invoice', cTag), type:'invoice', status:'confirmed', customer:c5._id, warehouse:wh, saleDate:new Date(Date.now()-6*86400000), items, shippingAmount:200, paymentMethod:'upi', ...t, isStockUpdated:true, companyId, createdBy:arjun._id, notes:BATCH });
    await deductStock(items, inv, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p13,3,p13.sellingPrice,10,18), calcItem(p9,5,p9.sellingPrice,0,18)];
    const sub = items.reduce((s,i)=>s+i.subtotal,0)+items.reduce((s,i)=>s+i.taxAmount,0);
    const t = totals(items,0,Math.round(sub));
    const inv = await Sale.create({ invoiceNumber:invNum('invoice', cTag), type:'invoice', status:'delivered', customer:c4._id, warehouse:wh, saleDate:new Date(Date.now()-86400000), items, paymentMethod:'cash', ...t, isStockUpdated:true, companyId, createdBy:arjun._id, notes:BATCH });
    await deductStock(items, inv, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p5,3,p5.sellingPrice,5,18), calcItem(p8,2,p8.sellingPrice,0,18), calcItem(p11,10,p11.sellingPrice,0,18)];
    const t = totals(items,500,15000);
    const inv = await Sale.create({ invoiceNumber:invNum('invoice', cTag), type:'invoice', status:'confirmed', customer:c7._id, warehouse:wh, saleDate:new Date(Date.now()-5*86400000), items, shippingAmount:500, paymentMethod:'bank', ...t, isStockUpdated:true, companyId, createdBy:arjun._id, notes:BATCH });
    await deductStock(items, inv, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p10,2,p10.sellingPrice,0,12), calcItem(p13,1,p13.sellingPrice,0,18)];
    const t = totals(items);
    const paidAmt = Math.round(t.totalAmount);
    const t2 = totals(items,0,paidAmt);
    const inv = await Sale.create({ invoiceNumber:invNum('invoice', cTag), type:'invoice', status:'confirmed', customer:c8._id, warehouse:wh, saleDate:new Date(), items, paymentMethod:'cash', ...t2, isStockUpdated:true, companyId, createdBy:arjun._id, notes:BATCH });
    await deductStock(items, inv, wh, companyId, adminUser._id, cTag);
  }
  {
    const items = [calcItem(p9,1,p9.sellingPrice,0,18)];
    await Sale.create({ invoiceNumber:invNum('sales_return', cTag), type:'sales_return', status:'confirmed', customer:c4._id, warehouse:wh, saleDate:new Date(), items, ...totals(items), isStockUpdated:false, companyId, createdBy:arjun._id, notes:BATCH });
    const prod = await Product.findById(p9._id);
    await Product.findByIdAndUpdate(p9._id, { $inc:{currentStock:1} });
    await StockMovement.create({ movementNumber:smNum(cTag), type:'sale_return', product:p9._id, warehouse:wh, quantity:1, previousStock:prod.currentStock, newStock:prod.currentStock+1, referenceType:'Sale', referenceNumber:`SR-${cTag}`, companyId, createdBy:adminUser._id });
  }
  logger.info('   ✔  8 sales created');

  // 11. Payments
  const paymentReceivedData = [
    { party:c1._id, partyType:'Customer', partyName:c1.name, amount:25000, method:'bank_transfer', date:new Date(Date.now()-5*86400000), notes:'Advance for bulk order' },
    { party:c5._id, partyType:'Customer', partyName:c5.name, amount:5000,  method:'upi',           date:new Date(Date.now()-6*86400000), notes:'Part payment INV-000004' },
    { party:c7._id, partyType:'Customer', partyName:c7.name, amount:15000, method:'cheque',        date:new Date(Date.now()-3*86400000), notes:'Cheque No. 445566' },
    { party:c3._id, partyType:'Customer', partyName:c3.name, amount:8000,  method:'cash',          date:new Date(Date.now()-86400000),   notes:'Against outstanding balance' },
  ];
  for (const pd of paymentReceivedData) {
    await Payment.create({ paymentNumber:payNum(cTag), type:'received', party:pd.party, partyType:pd.partyType, partyName:pd.partyName, amount:pd.amount, paymentDate:pd.date, paymentMethod:pd.method, status:'completed', notes:BATCH+' '+pd.notes, companyId, createdBy:priya._id });
  }
  const paymentMadeData = [
    { party:s1._id, partyType:'Supplier', partyName:s1.name, amount:180000, method:'bank_transfer', date:new Date(Date.now()-3*86400000), notes:'Against PI-000004' },
    { party:s3._id, partyType:'Supplier', partyName:s3.name, amount:90000,  method:'cheque',        date:new Date(Date.now()-7*86400000), notes:'Cheque No. 334455' },
    { party:s4._id, partyType:'Supplier', partyName:s4.name, amount:55000,  method:'upi',           date:new Date(Date.now()-2*86400000), notes:'UPI settlement' },
  ];
  for (const pd of paymentMadeData) {
    await Payment.create({ paymentNumber:payNum(cTag), type:'made', party:pd.party, partyType:pd.partyType, partyName:pd.partyName, amount:pd.amount, paymentDate:pd.date, paymentMethod:pd.method, status:'completed', notes:BATCH+' '+pd.notes, companyId, createdBy:priya._id });
  }
  logger.info('   ✔  7 payments created');

  // 12. Finance — Chart of Accounts
  const accountDefs = [
    { code:`FD-A001-${cTag}`, name:'Cash in Hand',           type:'Asset',    subCategory:'Current Asset',    balance:85000 },
    { code:`FD-A002-${cTag}`, name:'Bank Account — HDFC',    type:'Asset',    subCategory:'Current Asset',    balance:425000 },
    { code:`FD-A003-${cTag}`, name:'Accounts Receivable',    type:'Asset',    subCategory:'Current Asset',    balance:90000 },
    { code:`FD-A004-${cTag}`, name:'Inventory',              type:'Asset',    subCategory:'Current Asset',    balance:520000 },
    { code:`FD-A005-${cTag}`, name:'Accounts Payable',       type:'Liability',subCategory:'Current Liability',balance:220000 },
    { code:`FD-A006-${cTag}`, name:'Sales Tax Payable',      type:'Liability',subCategory:'Current Liability',balance:45000 },
    { code:`FD-A007-${cTag}`, name:'Owner\'s Capital',       type:'Equity',   subCategory:'Capital',          balance:800000 },
    { code:`FD-A008-${cTag}`, name:'Sales Revenue',          type:'Revenue',  subCategory:'Operating',        balance:680000 },
    { code:`FD-A009-${cTag}`, name:'Purchase Expense',       type:'Expense',  subCategory:'COGS',             balance:420000 },
    { code:`FD-A010-${cTag}`, name:'Rent Expense',           type:'Expense',  subCategory:'Operating',        balance:36000  },
    { code:`FD-A011-${cTag}`, name:'Salary Expense',         type:'Expense',  subCategory:'Operating',        balance:120000 },
    { code:`FD-A012-${cTag}`, name:'Utilities & Misc',       type:'Expense',  subCategory:'Operating',        balance:18000  },
  ];
  const accounts = {};
  for (const a of accountDefs) {
    let acc = await Account.findOne({ code: a.code });
    if (!acc) acc = await Account.create({ ...a, branch:br1._id, isSystem:false, status:'active' });
    accounts[a.code] = acc;
  }
  logger.info('   ✔  12 accounts created');

  // 13. Expenses & Income
  const expenseDefs = [
    { type:'Expense', cat:'Rent',        amt:18000, mode:'bank_transfer', date:new Date(Date.now()-30*86400000), payee:'Property Owner', desc:'Monthly office rent June' },
    { type:'Expense', cat:'Rent',        amt:18000, mode:'bank_transfer', date:new Date(Date.now()-2*86400000),  payee:'Property Owner', desc:'Monthly office rent July' },
    { type:'Expense', cat:'Salary',      amt:65000, mode:'bank_transfer', date:new Date(Date.now()-28*86400000), payee:'Staff',          desc:'Staff salaries June' },
    { type:'Expense', cat:'Salary',      amt:65000, mode:'bank_transfer', date:new Date(Date.now()-3*86400000),  payee:'Staff',          desc:'Staff salaries July' },
    { type:'Expense', cat:'Logistics',   amt:4500,  mode:'cash',          date:new Date(Date.now()-6*86400000),  payee:'Carrier Co.',    desc:'Delivery charges — Order batch' },
    { type:'Expense', cat:'Utilities',   amt:3200,  mode:'upi',           date:new Date(Date.now()-7*86400000),  payee:'MSEB',           desc:'Electricity bill July' },
    { type:'Expense', cat:'Maintenance', amt:1800,  mode:'cash',          date:new Date(Date.now()-4*86400000),  payee:'Mechanic',       desc:'Forklift maintenance' },
    { type:'Expense', cat:'Stationery',  amt:850,   mode:'cash',          date:new Date(Date.now()-86400000),    payee:'Office Depot',   desc:'Office supplies' },
    { type:'Income',  cat:'Commission',  amt:5000,  mode:'bank_transfer', date:new Date(Date.now()-5*86400000),  payee:'Partner Agency', desc:'Sales commission received' },
    { type:'Income',  cat:'Misc',        amt:1200,  mode:'cash',          date:new Date(Date.now()-3*86400000),  payee:'',               desc:'Scrap material sold' },
    { type:'Income',  cat:'Rent',        amt:8000,  mode:'bank_transfer', date:new Date(Date.now()-2*86400000),  payee:'Tenant',         desc:'Sub-let storage income' },
  ];
  for (const e of expenseDefs) {
    await Expense.create({ voucherNumber:expNum(cTag), type:e.type, category:e.cat, amount:e.amt, paymentMode:e.mode, date:e.date, branch:br1._id, payeeOrPayer:e.payee, description:`[${BATCH}] ${e.desc}`, recordedBy:priya._id });
  }

  // 14. Journal Entries
  const jeDefs = [
    { desc:'Sale Invoice — Sharma Builders', ref:'INV-000004', amt:25000, dr:`FD-A003-${cTag}`, cr:`FD-A008-${cTag}`, date:new Date(Date.now()-6*86400000) },
    { desc:'Payment received — Sharma Builders', ref:'PAY-000001', amt:25000, dr:`FD-A002-${cTag}`, cr:`FD-A003-${cTag}`, date:new Date(Date.now()-5*86400000) },
    { desc:'Purchase Invoice — Cement', ref:'PI-000004', amt:120000, dr:`FD-A004-${cTag}`, cr:`FD-A005-${cTag}`, date:new Date(Date.now()-2*86400000) },
    { desc:'Supplier payment — National Cement', ref:'PAY-000005', amt:90000, dr:`FD-A005-${cTag}`, cr:`FD-A002-${cTag}`, date:new Date(Date.now()-3*86400000) },
    { desc:'Monthly Rent Expense July', ref:'EXP-00002', amt:18000, dr:`FD-A010-${cTag}`, cr:`FD-A002-${cTag}`, date:new Date(Date.now()-2*86400000) },
  ];
  for (const je of jeDefs) {
    const drAcc = accounts[je.dr];
    const crAcc = accounts[je.cr];
    if (drAcc && crAcc) {
      await JournalEntry.create({ entryNumber:jrnNum(cTag), date:je.date, branch:br1._id, reference:je.ref, description:`[${BATCH}] ${je.desc}`, items:[{ account:drAcc._id, accountName:drAcc.name, debit:je.amt, credit:0, memo:je.desc },{ account:crAcc._id, accountName:crAcc.name, debit:0, credit:je.amt, memo:je.desc }], totalAmount:je.amt, status:'posted', createdBy:priya._id });
    }
  }

  // 15. Approvals
  const purchases = await Purchase.find({ companyId, notes: BATCH });
  const po1 = purchases[0];
  if (po1) {
    await Approval.create({ module:'PurchaseOrder', referenceId:po1._id, referenceNumber:po1.purchaseNumber, branch:br1._id, requestedBy:vikram._id, approver:adminUser._id, status:'pending', reason:'Large order needs head-office approval', payload:{ totalAmount:po1.totalAmount, supplier:s1.name } });
  }
  await Approval.create({ module:'Discount', referenceId:c7._id, referenceNumber:`DEMO-DISC-${cTag}`, branch:br1._id, requestedBy:arjun._id, approver:rahul._id, status:'approved', reason:'15% discount requested for bulk buyer', approvalComments:'Approved — strategic customer', payload:{ discountPct:15, customer:c7.name } });
  await Approval.create({ module:'PriceChange', referenceId:p1._id, referenceNumber:`DEMO-PC-${cTag}`, branch:br1._id, requestedBy:arjun._id, approver:rahul._id, status:'rejected', reason:'Reduce cement price by 5% to match competitor', approvalComments:'Rejected — margin too low', payload:{ product:p1.name, proposedPrice:399 } });
  await Approval.create({ module:'StockAdjustment', referenceId:p15._id, referenceNumber:`DEMO-ADJ-${cTag}`, branch:br1._id, requestedBy:deepa._id, approver:rahul._id, status:'approved', reason:'Physical count shows 8 extra units of Measuring Tape', approvalComments:'Verified — adjustment approved', payload:{ product:p15.name, adjustQty:8 } });

  // 16. Notifications
  const notifDefs = [
    { title:'Low Stock Alert',          message:`[${BATCH}] Ball Valve 1 inch is below minimum stock level (5 units remaining).`,         type:'low_stock',        priority:'high',     actionUrl:'/products' },
    { title:'Low Stock Alert',          message:`[${BATCH}] Measuring Tape 5m is critically low (2 units).`,                               type:'low_stock',        priority:'critical',  actionUrl:'/products' },
    { title:'New Sale Invoice',         message:`[${BATCH}] Invoice INV-000004 created for Sunrise Developers — ₹25,800`,                 type:'new_sale',         priority:'medium',    actionUrl:'/sales' },
    { title:'Payment Received',         message:`[${BATCH}] ₹25,000 received from Sharma Builders Pvt Ltd via Bank Transfer.`,            type:'payment_received',  priority:'medium',    actionUrl:'/payments' },
    { title:'New Purchase Invoice',     message:`[${BATCH}] Purchase invoice PI-000004 received from National Cement — ₹1,80,000.`,       type:'new_purchase',     priority:'medium',    actionUrl:'/purchases' },
    { title:'Approval Required',        message:`[${BATCH}] Purchase order ${po1?.purchaseNumber || 'PO-001'} requires your approval.`,   type:'warning',          priority:'high',      actionUrl:'/approvals' },
    { title:'Payment Due',              message:`[${BATCH}] Invoice INV-000004 has outstanding due of ₹20,800 from Sunrise Developers.`,  type:'payment_due',      priority:'high',      actionUrl:'/payments' },
    { title:'Stock Adjustment Done',    message:`[${BATCH}] Stock adjustment +8 units for Measuring Tape approved and applied.`,           type:'stock_adjustment',  priority:'low',      actionUrl:'/inventory' },
    { title:'Quotation Expiring Soon',  message:`[${BATCH}] Quotation QT-000002 for Sharma Builders expires in 20 days.`,                 type:'info',             priority:'low',       actionUrl:'/sales' },
    { title:'System Backup Completed',  message:`[${BATCH}] Nightly database backup completed successfully.`,                              type:'backup_completed', priority:'low',       actionUrl:'' },
  ];
  for (const n of notifDefs) {
    await Notification.create({ ...n, isGlobal:true, recipients:[adminUser._id], companyId, createdBy:adminUser._id });
  }
  logger.info(`   ✅ Demo data successfully seeded for "${company.name}"!`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Seeder Loop
// ─────────────────────────────────────────────────────────────────────────────
export async function seedAllData({ force = false } = {}) {
  let admin = await User.findOne({ email: 'admin@demo.com' });
  if (!admin) {
    logger.info('Base seed not found — running seed.js first...');
    const { seedDatabase } = await import('./seed.js');
    await seedDatabase();
  }

  const companies = await Company.find();
  if (!companies.length) {
    throw new Error('No companies found in database!');
  }

  logger.info(`Found ${companies.length} company/companies in database.`);

  for (const comp of companies) {
    let compAdmin = await User.findOne({ companyId: comp._id }).select('+password');
    if (!compAdmin) {
      const hashed = await bcrypt.hash('Admin@123', 12);
      let role = await Role.findOne({ name: 'super_admin' }) || await Role.findOne({ name: 'admin' });
      compAdmin = await User.create({
        firstName: comp.name,
        lastName: 'Admin',
        email: comp.email || `admin@${comp._id}.com`,
        password: hashed,
        role: role._id,
        companyId: comp._id,
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
      });
    }

    await seedSingleCompany(comp, compAdmin, force);
  }

  logger.info('');
  logger.info('═══════════════════════════════════════════════');
  logger.info('  ✅  ALL COMPANIES SEEDED SUCCESSFULLY!');
  logger.info('═══════════════════════════════════════════════');
  return { skipped: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
const isMain = process.argv[1]?.includes('seedAllData');
if (isMain) {
  const force = process.argv.includes('--force');
  connectDB()
    .then(() => seedAllData({ force }))
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error(err.stack || err.message || String(err));
      process.exit(1);
    });
}
