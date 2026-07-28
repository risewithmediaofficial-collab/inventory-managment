import Product from '../products/model.js';
import Customer from '../customers/model.js';
import Supplier from '../suppliers/model.js';
import Sale from '../sales/model.js';
import Purchase from '../purchases/model.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const globalSearch = async (req, res) => {
  const { q: query, companyId } = req;
  if (!query || query.trim().length < 2) {
    return sendSuccess(res, { results: [] });
  }

  const regex = new RegExp(query, 'i');
  const cId = companyId;
  const limit = 5;

  const [products, customers, suppliers, sales, purchases] = await Promise.all([
    Product.find({ companyId: cId, $or: [{ name: regex }, { sku: regex }, { barcode: regex }] }).select('name sku currentStock sellingPrice').limit(limit).lean(),
    Customer.find({ companyId: cId, $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select('name email phone').limit(limit).lean(),
    Supplier.find({ companyId: cId, $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select('name email phone').limit(limit).lean(),
    Sale.find({ companyId: cId, invoiceNumber: regex }).select('invoiceNumber totalAmount paymentStatus saleDate').populate('customer', 'name').limit(limit).lean(),
    Purchase.find({ companyId: cId, purchaseNumber: regex }).select('purchaseNumber totalAmount paymentStatus purchaseDate').populate('supplier', 'name').limit(limit).lean(),
  ]);

  sendSuccess(res, {
    products: products.map((p) => ({ ...p, _type: 'product' })),
    customers: customers.map((c) => ({ ...c, _type: 'customer' })),
    suppliers: suppliers.map((s) => ({ ...s, _type: 'supplier' })),
    sales: sales.map((s) => ({ ...s, _type: 'sale' })),
    purchases: purchases.map((p) => ({ ...p, _type: 'purchase' })),
    total: products.length + customers.length + suppliers.length + sales.length + purchases.length,
  });
};
