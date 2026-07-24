import User, { Role } from './model.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildPaginationMeta } from '../../utils/apiResponse.js';

export const getUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) {
    filter.$or = [{ firstName: new RegExp(query.search, 'i') }, { lastName: new RegExp(query.search, 'i') }, { email: new RegExp(query.search, 'i') }];
  }
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  const [data, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name displayName')
      .populate('assignedWarehouse', 'name code')
      .populate('assignedBranch', 'name code')
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('role')
    .populate('assignedWarehouse')
    .populate('assignedBranch')
    .select('-password -refreshTokens');
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const createUser = async (data, companyId, creatorId) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('User with this email already exists.', 409);
  return User.create({ ...data, companyId, createdBy: creatorId });
};

export const updateUser = async (id, data) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  if (data.password) delete data.password; // Don't update password here
  return User.findByIdAndUpdate(id, data, { new: true })
    .select('-password -refreshTokens')
    .populate('role')
    .populate('assignedWarehouse')
    .populate('assignedBranch');
};

export const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  await User.findByIdAndDelete(id);
};

export const approveUser = async (id, data) => {
  const user = await User.findById(id).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  if (data.roleId) user.role = data.roleId;
  if (data.assignedWarehouse !== undefined) user.assignedWarehouse = data.assignedWarehouse || null;
  if (data.assignedBranch !== undefined) user.assignedBranch = data.assignedBranch || null;
  
  if (data.password && data.password.trim().length > 0) {
    if (data.password.trim().length < 6) {
      throw new AppError('New password must be at least 6 characters long.', 400);
    }
    user.password = data.password.trim();
  }

  user.isApproved = data.isApproved !== undefined ? data.isApproved : true;
  user.isActive = data.isActive !== undefined ? data.isActive : true;
  user.approvalStatus = data.approvalStatus || (data.isApproved ? 'approved' : 'rejected');

  await user.save();
  return User.findById(id)
    .populate('role', 'name displayName')
    .populate('assignedWarehouse', 'name code')
    .populate('assignedBranch', 'name code')
    .select('-password -refreshTokens');
};

export const getRoles = async () => Role.find({ isActive: true });
export const createRole = async (data) => Role.create(data);
export const updateRole = async (id, data) => Role.findByIdAndUpdate(id, data, { new: true });
