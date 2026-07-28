import * as branchService from './service.js';

export const getBranches = async (req, res) => {
  const branches = await branchService.getAllBranchesService(req.query);
  res.json({ success: true, count: branches.length, data: branches });
};

export const getBranch = async (req, res) => {
  const branch = await branchService.getBranchByIdService(req.params.id);
  res.json({ success: true, data: branch });
};

export const createBranch = async (req, res) => {
  const branch = await branchService.createBranchService(req.body);
  res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
};

export const updateBranch = async (req, res) => {
  const branch = await branchService.updateBranchService(req.params.id, req.body);
  res.json({ success: true, message: 'Branch updated successfully', data: branch });
};

export const deleteBranch = async (req, res) => {
  await branchService.deleteBranchService(req.params.id);
  res.json({ success: true, message: 'Branch deleted successfully' });
};
