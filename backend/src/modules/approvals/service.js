import Approval from './model.js';
import { AppError } from '../../utils/AppError.js';

export const getApprovals = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.module) filter.module = query.module;
  if (query.branch) filter.branch = query.branch;

  return await Approval.find(filter)
    .populate('requestedBy', 'name email role')
    .populate('approver', 'name email')
    .populate('branch', 'name code')
    .sort({ createdAt: -1 });
};

export const createApprovalRequest = async (data, userId) => {
  return await Approval.create({
    ...data,
    requestedBy: userId,
  });
};

export const updateApprovalStatus = async (id, status, comments, approverId) => {
  const approval = await Approval.findById(id);
  if (!approval) throw new AppError('Approval request not found', 404);
  if (approval.status !== 'pending') throw new AppError(`Approval is already ${approval.status}`, 400);

  approval.status = status;
  approval.approvalComments = comments || '';
  approval.approver = approverId;
  await approval.save();

  return approval;
};
