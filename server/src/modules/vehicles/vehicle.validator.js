const { z } = require('zod');

const createVehicleSchema = z.object({
  registrationNo: z.string().min(3, 'Registration number is required').toUpperCase(),
  name: z.string().min(2, 'Vehicle model name is required'),
  type: z.enum(['TRUCK', 'VAN', 'BUS', 'CAR', 'MOTORCYCLE']),
  maxLoadCapacity: z.number().positive('Max load capacity must be greater than 0'),
  odometer: z.number().nonnegative().default(0),
  acquisitionCost: z.number().nonnegative().default(0),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).default('AVAILABLE'),
  region: z.string().optional(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional()
});

const updateVehicleSchema = createVehicleSchema.partial();

const updateVehicleStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']),
  odometer: z.number().nonnegative().optional()
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema
};
