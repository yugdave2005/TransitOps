const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config/env');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { initSocketServer } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.route');
const vehicleRoutes = require('./modules/vehicles/vehicle.route');
const driverRoutes = require('./modules/drivers/driver.route');
const tripRoutes = require('./modules/trips/trip.route');
const trackingRoutes = require('./modules/tracking/tracking.route');
const maintenanceRoutes = require('./modules/maintenance/maintenance.route');
const fuelRoutes = require('./modules/fuel/fuel.route');
const expenseRoutes = require('./modules/expenses/expense.route');
const reportsRoutes = require('./modules/reports/reports.route');
const { startStatusWorker } = require('./workers/status.worker');
const { startTelemetryWorker } = require('./workers/telemetry.worker');
const { startAnalyticsWorker } = require('./workers/analytics.worker');

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
const io = initSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportsRoutes);

// Base Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    // Connect RabbitMQ asynchronously without blocking HTTP server startup
    connectRabbitMQ();

    // Start background workers after AMQP handshake
    setTimeout(() => {
      startStatusWorker();
      startTelemetryWorker();
      startAnalyticsWorker();
    }, 1500);

    server.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`  TransitOps Server running on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
