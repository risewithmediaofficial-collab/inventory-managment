import * as authService from './service.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';

export const register = async (req, res) => {
  const { firstName, lastName, email, password, companyName, phone } = req.body;
  const result = await authService.register({ firstName, lastName, email, password, companyName, phone });
  sendCreated(res, result, 'Account created successfully');
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  sendSuccess(res, result, 'Login successful');
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  sendSuccess(res, result, 'Token refreshed');
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user._id, refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req, res) => {
  const user = await authService.getMe(req.user._id);
  sendSuccess(res, user, 'Profile fetched');
};
