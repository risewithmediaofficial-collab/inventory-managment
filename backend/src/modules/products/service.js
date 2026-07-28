import Product from './model.js';
import StockMovement from '../stock-movements/model.js';
import { AppError } from '../../utils/AppError.js';
import { emitToCompany } from '../../config/socket.js';
import slugify from 'slugify';
import {
  getPagination, buildPaginationMeta, buildSort, buildSearch, buildDateRange
} from '../../utils/apiResponse.js';

export const getProducts = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['name', 'sku', 'sellingPrice', 'currentStock', 'createdAt']);

  const filter = { companyId };
  if (query.search) {
    const searchFilter = buildSearch(query.search, ['name', 'sku', 'barcode']);
    Object.assign(filter, searchFilter);
  }
  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.stockStatus === 'low_stock') filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
  if (query.stockStatus === 'out_of_stock') filter.currentStock = { $lte: 0 };
  if (query.type) filter.type = query.type;

  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('unit', 'name symbol')
      .populate('tax', 'name rate')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getProductById = async (id, companyId) => {
  const product = await Product.findOne({ _id: id, companyId })
    .populate('category', 'name')
    .populate('brand', 'name logo')
    .populate('unit', 'name symbol')
    .populate('tax', 'name rate type')
    .populate('warehouseStock.warehouse', 'name code');

  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

export const createProduct = async (data, companyId, userId) => {
  const productData = {
    ...data,
    companyId,
    createdBy: userId,
    slug: slugify(data.name, { lower: true, strict: true }),
  };

  if (data.openingStock > 0) {
    productData.currentStock = data.openingStock;
  }

  const product = await Product.create(productData);

  // Record opening stock movement
  if (data.openingStock > 0) {
    await StockMovement.create({
      type: 'opening_stock',
      product: product._id,
      warehouse: data.warehouse,
      quantity: data.openingStock,
      previousStock: 0,
      newStock: data.openingStock,
      unitCost: data.purchasePrice || 0,
      totalCost: (data.purchasePrice || 0) * data.openingStock,
      notes: 'Opening stock entry',
      companyId,
      createdBy: userId,
    });
  }

  emitToCompany(companyId, 'product:created', { product });
  return product;
};

export const updateProduct = async (id, data, companyId, userId) => {
  const product = await Product.findOne({ _id: id, companyId });
  if (!product) throw new AppError('Product not found.', 404);

  if (data.name && data.name !== product.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }

  data.updatedBy = userId;
  const updated = await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate('category brand unit tax');

  emitToCompany(companyId, 'product:updated', { product: updated });
  return updated;
};

export const deleteProduct = async (id, companyId) => {
  const product = await Product.findOne({ _id: id, companyId });
  if (!product) throw new AppError('Product not found.', 404);

  if (product.currentStock > 0) {
    throw new AppError('Cannot delete product with existing stock. Deactivate it instead.', 400);
  }

  await Product.findByIdAndDelete(id);
  emitToCompany(companyId, 'product:deleted', { productId: id });
};

export const getLowStockProducts = async (companyId) => {
  return Product.find({
    companyId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStockLevel'] },
  })
    .populate('category', 'name')
    .populate('unit', 'symbol')
    .sort({ currentStock: 1 })
    .limit(50);
};

export const getProductStats = async (companyId) => {
  const stats = await Product.aggregate([
    { $match: { companyId: new (await import('mongoose')).default.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalInventoryValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
        outOfStock: { $sum: { $cond: [{ $lte: ['$currentStock', 0] }, 1, 0] } },
        lowStock: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStockLevel'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return stats[0] || { totalProducts: 0, activeProducts: 0, totalInventoryValue: 0, outOfStock: 0, lowStock: 0 };
};
