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

function mapStatusDbToFrontend(status) {
  if (status === 'OPEN') return 'SCHEDULED';
  if (status === 'CLOSED') return 'COMPLETED';
  return status;
}

function mapStatusFrontendToDb(status) {
  if (status === 'SCHEDULED') return 'OPEN';
  if (status === 'COMPLETED' || status === 'CANCELLED') return 'CLOSED';
  return status;
}

function mapLog(log) {
  if (!log) return null;
  
  let status = mapStatusDbToFrontend(log.status);
  let title = '';
  let description = log.description || '';
  let priority = 'MEDIUM';
  
  // Extract priority e.g. [HIGH] from description prefix
  const priorityMatch = description.match(/^\[(LOW|MEDIUM|HIGH|CRITICAL)\]\s*/);
  if (priorityMatch) {
    priority = priorityMatch[1];
    description = description.replace(priorityMatch[0], '');
  }
  
  // Extract title prefix e.g. "Title: Description"
  const titleMatch = description.match(/^([^:]+):\s*/);
  if (titleMatch) {
    title = titleMatch[1];
    description = description.replace(titleMatch[0], '');
  } else {
    title = description;
    description = '';
  }
  
  return {
    ...log,
    status,
    title,
    description,
    priority
  };
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

  // Map incoming frontend structure into database schema
  const dbStatus = mapStatusFrontendToDb(data.status || 'IN_PROGRESS');
  const dbData = {
    description: `[${data.priority || 'MEDIUM'}] ${data.title || ''}${data.description ? ': ' + data.description : ''}`,
    cost: data.cost || 0,
    status: dbStatus,
    scheduledDate: new Date(),
    vehicleId: data.vehicleId
  };

  // Atomically create log and set vehicle status to IN_SHOP
  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: dbData,
      include: { vehicle: true }
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'IN_SHOP' }
    })
  ]);

  const mappedLog = mapLog(log);
  await publishMaintenanceEvent('LOGGED', mappedLog);
  return mappedLog;
}

/**
 * Transition status and automatically release truck if shop work is finished
 */
async function updateLogStatus(id, newStatus, extraData = {}) {
  // maintenanceRepo.findById returns mapped log
  const log = await maintenanceRepo.findById(id);
  if (!log) throw new AppError('Maintenance log record not found', 404);

  const dbStatus = mapStatusFrontendToDb(newStatus);

  // If completed or cancelled, release truck back to AVAILABLE
  if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
    const [updatedLog] = await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id: log.id },
        data: { status: dbStatus, ...extraData },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    const mappedLog = mapLog(updatedLog);
    await publishMaintenanceEvent(newStatus, mappedLog);
    return mappedLog;
  }

  // Otherwise keep/ensure IN_SHOP
  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: log.id },
      data: { status: dbStatus, ...extraData },
      include: { vehicle: true }
    }),
    prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: 'IN_SHOP' }
    })
  ]);

  const mappedLog = mapLog(updatedLog);
  await publishMaintenanceEvent(newStatus, mappedLog);
  return mappedLog;
}

module.exports = {
  getLogs,
  getLogById,
  getMetrics,
  createLog,
  updateLogStatus
};
