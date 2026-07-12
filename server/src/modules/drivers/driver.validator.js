const { z } = require('zod');

const createDriverSchema = z.object({
  name: z.string().min(2, 'Driver full name is required'),
  licenseNumber: z.string().min(4, 'License number is required').toUpperCase(),
  licenseCategory: z.string().min(1, 'License category is required (e.g. C, CE, D)'),
  licenseExpiry: z.string().or(z.date()).transform(val => new Date(val)),
  contactNumber: z.string().min(7, 'Contact phone number is required'),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).default('AVAILABLE')
});

const updateDriverSchema = createDriverSchema.partial();

const updateDriverStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']),
  safetyScore: z.number().min(0).max(100).optional()
});

module.exports = {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema
};
