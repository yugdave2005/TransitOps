const dotenv = require('dotenv');
const path = require('path');

// Load .env from server dir or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/transitops?schema=public',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  jwtSecret: process.env.JWT_SECRET || 'transitops-super-secret-jwt-key-2026-hackathon',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
