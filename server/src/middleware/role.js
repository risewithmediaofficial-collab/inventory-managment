import { AppError } from '../utils/AppError.js';

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource.', 401));
    }

    const userRole = req.user.role?.name || req.user.role;
    if (!roles.includes(userRole)) {
      return next(
        new AppError(
          `Role '${userRole}' does not have permission to perform this action.`,
          403
        )
      );
    }
    next();
  };
};

// Check specific permission
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in.', 401));
    }

    const permissions = req.user.role?.permissions || [];
    if (!permissions.includes(permission) && req.user.role?.name !== 'super_admin') {
      return next(
        new AppError(`You do not have permission to '${permission}'.`, 403)
      );
    }
    next();
  };
};

// Role hierarchy for comparison
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  ACCOUNTANT: 'accountant',
  SALES_EXECUTIVE: 'sales_executive',
  WAREHOUSE_MANAGER: 'warehouse_manager',
};
