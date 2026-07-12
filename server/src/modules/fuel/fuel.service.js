const fuelRepo = require('./fuel.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');
const prisma = require('../../config/prisma');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function getLogs(filters) {
  return await fuelRepo.findAll(filters);
}

async function getMetrics() {
  return await fuelRepo.getMetrics();
}

async function logFuel(data) {
  const vehicle = await vehicleRepo.findVehicleById(data.vehicleId);
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  if (data.odometerReading < vehicle.odometer) {
    throw new AppError(`Fuel log odometer reading (${data.odometerReading} km) cannot be less than current vehicle odometer (${vehicle.odometer} km).`, 400);
  }

  // Atomically create fuel log & update truck odometer if higher
  const [log] = await prisma.$transaction([
    prisma.fuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId || null,
        liters: data.liters,
        costPerLiter: data.costPerLiter,
        totalCost: Number((data.liters * data.costPerLiter).toFixed(2)),
        odometerReading: data.odometerReading,
        stationName: data.stationName
      },
      include: { vehicle: true, driver: true }
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { odometer: Math.max(vehicle.odometer, data.odometerReading) }
    })
  ]);

  return log;
}

module.exports = {
  getLogs,
  getMetrics,
  logFuel
};
