const { z } = require('zod');

const createTripSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  driverId: z.string().uuid('Invalid driver ID format'),
  origin: z.string().min(2, 'Origin location must be at least 2 characters'),
  destination: z.string().min(2, 'Destination location must be at least 2 characters'),
  cargoWeight: z.number().positive('Cargo weight must be greater than 0 kg'),
  scheduledDeparture: z.string().datetime().optional(),
  scheduledArrival: z.string().datetime().optional()
});

const updateTripStatusSchema = z.object({
  status: z.enum(['DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  finalOdometer: z.number().positive('Final odometer reading must be positive').optional()
});

module.exports = {
  createTripSchema,
  updateTripStatusSchema
};
