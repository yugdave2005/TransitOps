const { z } = require('zod');

const createMaintenanceLogSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().optional(),
  cost: z.number().min(0, 'Cost cannot be negative').default(0),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('IN_PROGRESS')
});

const updateMaintenanceStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cost: z.number().min(0).optional(),
  description: z.string().optional()
});

module.exports = {
  createMaintenanceLogSchema,
  updateMaintenanceStatusSchema
};
