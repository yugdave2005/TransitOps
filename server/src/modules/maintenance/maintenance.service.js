const maintenanceRepo = require('./maintenance.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');
const { publishMaintenanceEvent } = require('./maintenance.producer');
const prisma = require('../../config/prisma');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function getLogs(filters) {
  return await maintenanceRepo.findAll(filters);
}

async function getLogById(id) {
  const log = await maintenanceRepo.findById(id);
  if (!log) throw new AppError('Maintenance log record not found', 404);
  return log;
}

async function getMetrics() {
  return await maintenanceRepo.getMetrics();
}

/**
 * Create a maintenance log and lock truck status to IN_SHOP
 */
async function createLog(data) {
  const vehicle = await vehicleRepo.findVehicleById(data.vehicleId);
  if (!vehicle) throw new AppError('Specified vehicle does not exist in registry', 404);

  if (vehicle.status === 'ON_TRIP') {
    throw new AppError(`Cannot check vehicle ${vehicle.registrationNo} into shop while it is ON_TRIP en route.`, 400);
  }

  // Atomically create log and set vehicle status to IN_SHOP
  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data,
      include: { vehicle: true }
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'IN_SHOP' }
    })
  ]);

  await publishMaintenanceEvent('LOGGED', log);
  return log;
}

/**
 * Transition status and automatically release truck if shop work is finished
 */
async function updateLogStatus(id, newStatus, extraData = {}) {
  const log = await maintenanceRepo.findById(id);
  if (!log) throw new AppError('Maintenance log record not found', 404);

  // If completed or cancelled, release truck back to AVAILABLE
  if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
    const [updatedLog] = await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id: log.id },
        data: { status: newStatus, ...extraData },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    await publishMaintenanceEvent(newStatus, updatedLog);
    return updatedLog;
  }

  // Otherwise keep/ensure IN_SHOP
  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: log.id },
      data: { status: newStatus, ...extraData },
      include: { vehicle: true }
    }),
    prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: 'IN_SHOP' }
    })
  ]);

  await publishMaintenanceEvent(newStatus, updatedLog);
  return updatedLog;
}

module.exports = {
  getLogs,
  getLogById,
  getMetrics,
  createLog,
  updateLogStatus
};
