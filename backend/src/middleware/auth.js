import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import User from '../modules/users/model.js';

export const protect = async (req, res, next) => {
  try {
    // 1) Get token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('You are not logged in. Please log in to access this route.', 401);
    }

    // 2) Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('role');
    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 401);
    }

    // 5) Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id).populate('role');
      if (currentUser?.isActive) {
        req.user = currentUser;
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.name || req.user?.role || '';
    if (!roles.includes(userRole) && userRole !== 'super-admin' && userRole !== 'admin') {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
};
