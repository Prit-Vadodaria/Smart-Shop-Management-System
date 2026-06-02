import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { validateEnv } from './utils/envValidator.js';
import globalErrorHandler from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';
import bootstrapAdmin from './utils/bootstrapAdmin.js';

// Route imports
import authRoutes from './modules/auth/routes/auth.routes.js';
import productRoutes from './modules/products/routes/product.routes.js';
import orderRoutes from './modules/billing/routes/billing.routes.js';
import customerRoutes from './modules/customers/routes/customer.routes.js';
import adminCustomerRoutes from './modules/customers/routes/admin.customer.routes.js';
import subscriptionRoutes from './modules/subscriptions/routes/subscription.routes.js';
import supplierRoutes from './modules/suppliers/routes/supplier.routes.js';
import paymentRoutes from './modules/billing/routes/payment.routes.js';
import settingsRoutes from './modules/settings/routes/settings.routes.js';
import notificationRoutes from './modules/notifications/routes/notification.routes.js';
import { addRealtimeClient } from './services/realtimeHub.js';
import { authenticateRealtime } from './middleware/realtimeAuth.js';
import dns from 'dns';

dns.setServers(["1.1.1.1", "8.8.8.8"]);
// Load env vars
dotenv.config();

// Validate env vars
validateEnv();

// Connect to database
await connectDB();
await bootstrapAdmin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/realtime/stream', async (req, res) => {
  const user = await authenticateRealtime(req, res);
  if (!user) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write('retry: 3000\n\n');

  const cleanup = addRealtimeClient(res);
  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    cleanup();
  });
});

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
