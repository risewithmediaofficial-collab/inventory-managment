import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import User, { Role } from '../users/model.js';
import Company from '../settings/model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../config/logger.js';

const generateTokens = (userId, companyId) => {
  const accessToken = jwt.sign(
    { id: userId, companyId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: userId, companyId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

export const register = async ({ firstName, lastName, email, password, companyName, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Check if any company exists in the system
  const existingCompanyCount = await Company.countDocuments();
  let company;
  let isFirstUser = existingCompanyCount === 0;

  let superAdminRole = await Role.findOne({ name: 'super_admin' });
  if (!superAdminRole) {
    superAdminRole = await Role.create({
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full system access',
      permissions: ['*'],
    });
  }

  if (isFirstUser) {
    company = await Company.create({ name: companyName || 'My Company' });
  } else {
    company = await Company.findOne();
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    companyId: company._id,
    role: isFirstUser ? superAdminRole._id : null,
    isApproved: isFirstUser,
    isActive: isFirstUser,
    approvalStatus: isFirstUser ? 'approved' : 'pending',
  });

  if (isFirstUser) {
    company.createdBy = user._id;
    await company.save();
    const { accessToken, refreshToken } = generateTokens(user._id, company._id);
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken, user: sanitizeUser(user) };
  }

  return {
    isPendingApproval: true,
    message: 'Registration successful! Your account is pending Admin approval and role assignment. Please contact an Administrator.',
  };
};

export const login = async ({ email, identifier, password }) => {
  const loginId = (email || identifier || '').trim();
  if (!loginId || !password) {
    throw new AppError('Mobile number / Email and Password are required.', 400);
  }

  const user = await User.findOne({
    $or: [
      { email: loginId.toLowerCase() },
      { phone: loginId },
    ],
  })
    .select('+password +refreshTokens')
    .populate('role');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid mobile number/email or password.', 401);
  }

  const isSuperAdmin = user.role?.name === 'super_admin' || user.role?.name === 'admin';

  if (isSuperAdmin && (user.approvalStatus !== 'approved' || !user.isApproved || !user.isActive)) {
    user.isApproved = true;
    user.approvalStatus = 'approved';
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
  } else {
    if (user.approvalStatus === 'pending' || !user.isApproved) {
      throw new AppError('Your account is pending Admin approval, Role & Warehouse assignment. Please contact your M K Corporates Administrator.', 403);
    }

    if (user.approvalStatus === 'rejected') {
      throw new AppError('Your account approval request was declined by an Administrator.', 403);
    }

    if (!user.isActive) {
      throw new AppError('Your account is inactive. Please contact an Administrator.', 403);
    }
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.companyId);

  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email || user.phone}`);
  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token required.', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens').populate('role');
  if (!user || !user.refreshTokens?.includes(refreshToken)) {
    throw new AppError('Refresh token not found. Please log in again.', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.companyId);

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId).select('+refreshTokens');
  if (user) {
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
    await user.save({ validateBeforeSave: false });
  }
};

export const getMe = async (userId) => {
  const user = await User.findById(userId).populate('role').populate('companyId');
  if (!user) throw new AppError('User not found.', 404);
  return sanitizeUser(user);
};

const sanitizeUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  companyId: user.companyId,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});
