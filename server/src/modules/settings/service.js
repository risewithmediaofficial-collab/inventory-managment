import Company from './model.js';
import { AppError } from '../../utils/AppError.js';

export const getSettings = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError('Company not found.', 404);
  return company;
};

export const updateSettings = async (companyId, data) => {
  return Company.findByIdAndUpdate(companyId, { $set: data }, { new: true, runValidators: true });
};
