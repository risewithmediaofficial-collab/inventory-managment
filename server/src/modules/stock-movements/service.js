import StockMovement from './model.js';
import { getPagination, buildPaginationMeta, buildSort } from '../../utils/apiResponse.js';

export const getStockMovements = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const sort = buildSort(query, ['createdAt', 'quantity']);
  const filter = { companyId };
  if (query.product) filter.product = query.product;
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.type) filter.type = query.type;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) { const e = new Date(query.endDate); e.setHours(23,59,59); filter.createdAt.$lte = e; }
  }

  const [data, total] = await Promise.all([
    StockMovement.find(filter).populate('product', 'name sku').populate('warehouse', 'name').populate('createdBy', 'firstName lastName').sort(sort).skip(skip).limit(limit).lean(),
    StockMovement.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
