import * as approvalService from './service.js';

export const getApprovals = async (req, res) => {
  const approvals = await approvalService.getApprovals(req.query);
  res.json({ success: true, count: approvals.length, data: approvals });
};

export const createApproval = async (req, res) => {
  const approval = await approvalService.createApprovalRequest(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Approval request submitted', data: approval });
};

export const processApproval = async (req, res) => {
  const { status, comments } = req.body;
  const approval = await approvalService.updateApprovalStatus(req.params.id, status, comments, req.user._id);
  res.json({ success: true, message: `Request successfully ${status}`, data: approval });
};
