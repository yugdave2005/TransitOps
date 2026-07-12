const driverRepo = require('./driver.repository');
const { emitToAll } = require('../../config/socket');
const { publishEvent } = require('../../events/publisher');

function emitDriverChanged(event, driver) {
  emitToAll('driver:updated', { event, driver });
  if (event === 'status_changed') {
    emitToAll('driver:statusChange', { driverId: driver.id, status: driver.status, safetyScore: driver.safetyScore });
  }
  publishEvent(`driver.${event}`, {
    driverId: driver.id,
    licenseNumber: driver.licenseNumber,
    status: driver.status,
    timestamp: new Date().toISOString()
  });
}

async function getAllDrivers(filters) {
  return driverRepo.findAll(filters);
}

async function getAvailableDrivers() {
  return driverRepo.findAvailableAndCompliant();
}

async function getComplianceRisks() {
  return driverRepo.findComplianceRisks();
}

async function getDriverById(id) {
  const driver = await driverRepo.findById(id);
  if (!driver) {
    const error = new Error('Driver not found.');
    error.status = 404;
    throw error;
  }
  return driver;
}

async function getMetrics() {
  return driverRepo.getSummaryMetrics();
}

async function createDriver(data) {
  const existing = await driverRepo.findByLicense(data.licenseNumber);
  if (existing) {
    const error = new Error(`Driver with license number '${data.licenseNumber}' already exists.`);
    error.status = 409;
    throw error;
  }

  // If license already expired, cannot create as AVAILABLE unless explicit
  const now = new Date();
  if (new Date(data.licenseExpiry) < now && data.status === 'AVAILABLE') {
    const error = new Error('Cannot set driver status to AVAILABLE when license is already expired.');
    error.status = 400;
    throw error;
  }

  const driver = await driverRepo.create(data);
  emitDriverChanged('created', driver);
  return driver;
}

async function updateDriver(id, data) {
  await getDriverById(id);
  const updated = await driverRepo.update(id, data);
  emitDriverChanged('updated', updated);
  return updated;
}

async function updateDriverStatus(id, { status, safetyScore }) {
  const driver = await getDriverById(id);

  // Business Rule check: cannot set to AVAILABLE if license is expired
  if (status === 'AVAILABLE' && new Date(driver.licenseExpiry) < new Date()) {
    const error = new Error(`Cannot set driver '${driver.name}' to AVAILABLE because their license expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}.`);
    error.status = 400;
    throw error;
  }

  const updated = await driverRepo.update(id, {
    status,
    ...(safetyScore !== undefined && { safetyScore })
  });

  emitDriverChanged('status_changed', updated);
  return updated;
}

async function deleteDriver(id) {
  const driver = await getDriverById(id);
  if (driver.status === 'ON_TRIP') {
    const error = new Error('Cannot delete a driver who is currently ON_TRIP.');
    error.status = 400;
    throw error;
  }
  await driverRepo.remove(id);
  emitDriverChanged('deleted', { id });
  return { id };
}

module.exports = {
  getAllDrivers,
  getAvailableDrivers,
  getComplianceRisks,
  getDriverById,
  getMetrics,
  createDriver,
  updateDriver,
  updateDriverStatus,
  deleteDriver
};
