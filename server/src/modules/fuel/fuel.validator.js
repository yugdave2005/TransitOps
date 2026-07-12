const { z } = require('zod');

const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  driverId: z.string().uuid('Invalid driver ID format').optional(),
  liters: z.number().positive('Fuel liters must be greater than 0'),
  costPerLiter: z.number().positive('Cost per liter must be positive'),
  odometerReading: z.number().positive('Odometer reading must be positive'),
  stationName: z.string().min(2, 'Station name required')
});

module.exports = {
  createFuelLogSchema
};
