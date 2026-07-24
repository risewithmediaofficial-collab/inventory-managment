import * as productService from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';

export const getProducts = async (req, res) => {
  const { data, pagination } = await productService.getProducts(req.query, req.user.companyId);
  sendPaginated(res, data, pagination, 'Products fetched');
};

export const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user.companyId);
  sendSuccess(res, product);
};

export const createProduct = async (req, res) => {
  if (req.files) {
    req.body.images = req.files.map((f) => `/uploads/${f.filename}`);
    req.body.thumbnail = req.body.images[0];
  }
  const product = await productService.createProduct(req.body, req.user.companyId, req.user._id);
  sendCreated(res, product, 'Product created successfully');
};

export const updateProduct = async (req, res) => {
  if (req.files?.length) {
    req.body.images = req.files.map((f) => `/uploads/${f.filename}`);
  }
  const product = await productService.updateProduct(req.params.id, req.body, req.user.companyId, req.user._id);
  sendSuccess(res, product, 'Product updated successfully');
};

export const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.companyId);
  sendSuccess(res, null, 'Product deleted successfully');
};

export const getLowStockProducts = async (req, res) => {
  const products = await productService.getLowStockProducts(req.user.companyId);
  sendSuccess(res, products, 'Low stock products fetched');
};

export const getProductStats = async (req, res) => {
  const stats = await productService.getProductStats(req.user.companyId);
  sendSuccess(res, stats);
};
