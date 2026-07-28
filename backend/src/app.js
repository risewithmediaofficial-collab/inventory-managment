import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';

import env from './config/env.js';
import logger from './config/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

// Routes
import authRoutes from './modules/auth/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import productRoutes from './modules/products/routes.js';
import categoryRoutes from './modules/categories/routes.js';
import brandRoutes from './modules/brands/routes.js';
import unitRoutes from './modules/units/routes.js';
import warehouseRoutes from './modules/warehouses/routes.js';
import taxRoutes from './modules/taxes/routes.js';
import supplierRoutes from './modules/suppliers/routes.js';
import customerRoutes from './modules/customers/routes.js';
import purchaseRoutes from './modules/purchases/routes.js';
import saleRoutes from './modules/sales/routes.js';
import stockMovementRoutes from './modules/stock-movements/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import userRoutes from './modules/users/routes.js';
import settingsRoutes from './modules/settings/routes.js';
import searchRoutes from './modules/search/routes.js';
import auditRoutes from './modules/audit/routes.js';
import branchRoutes from './modules/branches/routes.js';
import financeRoutes from './modules/finance/routes.js';
import approvalRoutes from './modules/approvals/routes.js';
import documentRoutes from './modules/documents/routes.js';
import reportRoutes from './modules/reports/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB sanitize (prevent NoSQL injection)
app.use(mongoSanitize());

// Compression
app.use(compression());

// HTTP logging
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_PATH)));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/brands`, brandRoutes);
app.use(`${API}/units`, unitRoutes);
app.use(`${API}/warehouses`, warehouseRoutes);
app.use(`${API}/taxes`, taxRoutes);
app.use(`${API}/suppliers`, supplierRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/purchases`, purchaseRoutes);
app.use(`${API}/sales`, saleRoutes);
app.use(`${API}/stock-movements`, stockMovementRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/search`, searchRoutes);
app.use(`${API}/audit`, auditRoutes);
app.use(`${API}/branches`, branchRoutes);
app.use(`${API}/finance`, financeRoutes);
app.use(`${API}/approvals`, approvalRoutes);
app.use(`${API}/documents`, documentRoutes);
app.use(`${API}/reports`, reportRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;
