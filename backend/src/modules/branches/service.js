import Branch from './model.js';
import { AppError } from '../../utils/AppError.js';

export const getAllBranchesService = async (query = {}) => {
  const { status, search } = query;
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }

  return await Branch.find(filter).populate('manager', 'name email phone').populate('warehouse', 'name code');
};

export const getBranchByIdService = async (id) => {
  const branch = await Branch.findById(id).populate('manager', 'name email phone').populate('warehouse', 'name code');
  if (!branch) throw new AppError('Branch not found', 404);
  return branch;
};

export const createBranchService = async (data) => {
  const existing = await Branch.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AppError('Branch code already exists', 400);

  if (data.isHeadOffice) {
    await Branch.updateMany({}, { isHeadOffice: false });
  }

  return await Branch.create(data);
};

export const updateBranchService = async (id, data) => {
  if (data.isHeadOffice) {
    await Branch.updateMany({ _id: { $ne: id } }, { isHeadOffice: false });
  }

  const branch = await Branch.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!branch) throw new AppError('Branch not found', 404);
  return branch;
};

export const deleteBranchService = async (id) => {
  const branch = await Branch.findByIdAndDelete(id);
  if (!branch) throw new AppError('Branch not found', 404);
  return branch;
};
