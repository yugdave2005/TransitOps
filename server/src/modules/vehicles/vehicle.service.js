const vehicleRepo = require('./vehicle.repository');
const vehicleProducer = require('./vehicle.producer');

async function getAllVehicles(filters) {
  return vehicleRepo.findAll(filters);
}

async function getAvailableVehicles(minCapacity) {
  const capacity = minCapacity ? parseFloat(minCapacity) : 0;
  return vehicleRepo.findAvailableForDispatch(capacity);
}

async function getVehicleById(id) {
  const vehicle = await vehicleRepo.findById(id);
  if (!vehicle) {
    const error = new Error('Vehicle not found.');
    error.status = 404;
    throw error;
  }
  return vehicle;
}

async function getMetrics() {
  return vehicleRepo.getSummaryMetrics();
}

async function createVehicle(data) {
  const existing = await vehicleRepo.findByRegistration(data.registrationNo);
  if (existing) {
    const error = new Error(`Vehicle with registration number '${data.registrationNo}' already exists.`);
    error.status = 409;
    throw error;
  }

  const vehicle = await vehicleRepo.create(data);
  vehicleProducer.emitVehicleChanged('created', vehicle);
  return vehicle;
}

async function updateVehicle(id, data) {
  await getVehicleById(id); // Check existence
  const updated = await vehicleRepo.update(id, data);
  vehicleProducer.emitVehicleChanged('updated', updated);
  return updated;
}

async function updateVehicleStatus(id, { status, odometer }) {
  const vehicle = await getVehicleById(id);
  
  // If odometer passed, ensure it is >= current
  if (odometer !== undefined && odometer < vehicle.odometer) {
    const error = new Error(`New odometer (${odometer}) cannot be less than current odometer (${vehicle.odometer}).`);
    error.status = 400;
    throw error;
  }

  const updated = await vehicleRepo.update(id, {
    status,
    ...(odometer !== undefined && { odometer })
  });

  vehicleProducer.emitVehicleChanged('status_changed', updated);
  return updated;
}

async function deleteVehicle(id) {
  const vehicle = await getVehicleById(id);
  if (vehicle.status === 'ON_TRIP') {
    const error = new Error('Cannot delete a vehicle that is currently ON_TRIP.');
    error.status = 400;
    throw error;
  }
  await vehicleRepo.remove(id);
  vehicleProducer.emitVehicleChanged('deleted', { id });
  return { id };
}

module.exports = {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  getMetrics,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle
};
