import Audit from './model.js';
import { getPagination, buildPaginationMeta, sendPaginated } from '../../utils/apiResponse.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const createAuditLog = async (data) => {
  try {
    await Audit.create(data);
  } catch { /* silent - audit failures should not affect business logic */ }
};

const getAuditLogs = async (query, companyId) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { companyId };
  if (query.action) filter.action = query.action;
  if (query.resource) filter.resource = query.resource;
  if (query.user) filter.user = query.user;
  const [data, total] = await Promise.all([
    Audit.find(filter).populate('user', 'firstName lastName email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Audit.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const auditController = {
  getAll: async (req, res) => {
    const r = await getAuditLogs(req.query, req.user.companyId);
    sendPaginated(res, r.data, r.pagination);
  },
};
