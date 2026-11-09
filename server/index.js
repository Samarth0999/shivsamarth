const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { db } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const settingRoutes = require('./routes/settings');
const studentRoutes = require('./routes/students');
const batchRoutes = require('./routes/batches');
const attendanceRoutes = require('./routes/attendance');
const payrollRoutes = require('./routes/payroll');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public endpoints & Leads API
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);

// Protected Staff Management APIs
app.use('/api/branches', authMiddleware, branchRoutes);
app.use('/api/settings', authMiddleware, settingRoutes);
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/batches', authMiddleware, batchRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/payroll', authMiddleware, payrollRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Driving School Management API', timestamp: new Date().toISOString() });
});

// Serve frontend in production & images
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientPublicImages = path.join(__dirname, '..', 'client', 'public', 'images');
app.use('/images', express.static(clientPublicImages));
app.use(express.static(clientDistPath));

// Fallback SPA handler for non-API routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('API Server is running. The frontend build was not found. Run `npm run build` to generate the client build artifacts.');
});

const server = app.listen(PORT, () => {
  console.log(`🚗 Driving School Backend Server running on port http://localhost:${PORT}`);
});

// Graceful shutdown handling for container and cloud deployments
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    try {
      db.close();
      console.log('Database connection closed cleanly.');
    } catch (e) {}
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown timeout reached.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server };
