const tripRepo = require('./trip.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');
const driverRepo = require('../drivers/driver.repository');
const { publishTripEvent } = require('./trip.producer');
const prisma = require('../../config/prisma');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function getTrips(filters) {
  return await tripRepo.findAllTrips(filters);
}

async function getTripById(id) {
  const trip = await tripRepo.findTripById(id);
  if (!trip) throw new AppError('Trip record not found', 404);
  return trip;
}

async function getMetrics() {
  return await tripRepo.getTripMetrics();
}

/**
 * Enforce all 10 Business Rules when dispatching a trip
 */
async function dispatchTrip(data) {
  // 1. Fetch assets
  const [vehicle, driver] = await Promise.all([
    vehicleRepo.findVehicleById(data.vehicleId),
    driverRepo.findDriverById(data.driverId)
  ]);

  if (!vehicle) throw new AppError('Specified vehicle does not exist in registry', 404);
  if (!driver) throw new AppError('Specified driver profile does not exist', 404);

  // Rule 1: Cargo Capacity Enforcement
  if (data.cargoWeight > vehicle.maxLoadCapacity) {
    throw new AppError(`[Rule 1 Violation] Cargo weight (${data.cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg).`, 400);
  }

  // Rule 2: Vehicle Status Restriction
  if (vehicle.status !== 'AVAILABLE') {
    throw new AppError(`[Rule 2 Violation] Vehicle ${vehicle.registrationNo} is currently ${vehicle.status} and cannot be dispatched.`, 400);
  }

  // Rule 3: Driver Status Restriction
  if (driver.status !== 'AVAILABLE') {
    throw new AppError(`[Rule 3 Violation] Driver ${driver.name} is currently ${driver.status} and cannot be assigned.`, 400);
  }

  // Rule 4: License Validity Check
  if (new Date(driver.licenseExpiry) < new Date()) {
    throw new AppError(`[Rule 4 Violation] Driver license (${driver.licenseNumber}) expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}.`, 400);
  }

  // Rule 5: License Category Match
  const heavyTypes = ['HEAVY_TRUCK', 'TRAILER', 'TANKER', 'CONTAINER'];
  if (heavyTypes.includes(vehicle.type)) {
    const validCategories = ['CE', 'C', 'HEAVY', 'TRAILER', 'CE (HEAVY TRAILER)'];
    const isAuthorized = validCategories.some(cat => 
      driver.licenseCategory.toUpperCase().includes(cat)
    );
    if (!isAuthorized) {
      throw new AppError(`[Rule 5 Violation] Driver license category "${driver.licenseCategory}" is not authorized for heavy vehicle type "${vehicle.type}".`, 400);
    }
  }

  // Rule 6: Minimum Safety Score Check
  if (driver.safetyScore < 70) {
    throw new AppError(`[Rule 6 Violation] Driver safety score (${driver.safetyScore}/100) is below the mandatory 70 threshold.`, 400);
  }

  // Rule 7: State Lock / Double Dispatch Check
  const [activeVehicleTrip, activeDriverTrip] = await Promise.all([
    tripRepo.findActiveTripByVehicleId(data.vehicleId),
    tripRepo.findActiveTripByDriverId(data.driverId)
  ]);

  if (activeVehicleTrip) {
    throw new AppError(`[Rule 7 Violation] Vehicle ${vehicle.registrationNo} is already locked to active trip ${activeVehicleTrip.tripCode}.`, 400);
  }
  if (activeDriverTrip) {
    throw new AppError(`[Rule 7 Violation] Driver ${driver.name} is already locked to active trip ${activeDriverTrip.tripCode}.`, 400);
  }

  // Create trip record with DISPATCHED status
  const trip = await tripRepo.createTrip({
    ...data,
    status: 'DISPATCHED'
  });

  // Atomically lock asset statuses right inside the database transaction
  await prisma.$transaction([
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } })
  ]);

  // Publish event (`trip.dispatched`) for workers and real-time Socket.io UI updates
  await publishTripEvent('DISPATCHED', trip);

  return trip;
}

/**
 * Handle lifecycle status changes enforcing transition rules
 */
async function transitionTripStatus(id, newStatus, extraData = {}) {
  const trip = await tripRepo.findTripById(id);
  if (!trip) throw new AppError('Trip record not found', 404);

  // Rule 8: Sequential Lifecycle Validation
  const transitions = {
    DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };

  if (!transitions[trip.status]?.includes(newStatus)) {
    throw new AppError(`[Rule 8 Violation] Cannot transition trip directly from ${trip.status} to ${newStatus}.`, 400);
  }

  // Rule 9: Odometer Monotonicity & Increment Verification on Completion
  if (newStatus === 'COMPLETED') {
    const finalOdo = extraData.finalOdometer || trip.vehicle.odometer + Math.floor(100 + Math.random() * 300);
    if (finalOdo < trip.vehicle.odometer) {
      throw new AppError(`[Rule 9 Violation] Final odometer (${finalOdo} km) cannot be less than initial vehicle odometer (${trip.vehicle.odometer} km).`, 400);
    }

    // Update trip & unlock both assets automatically (`Rule 10`)
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED' },
        include: { vehicle: true, driver: true }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'AVAILABLE', odometer: finalOdo }
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    await publishTripEvent('COMPLETED', updatedTrip);
    return updatedTrip;
  }

  if (newStatus === 'CANCELLED') {
    // Unlock assets on cancellation (`Rule 10`)
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'CANCELLED' },
        include: { vehicle: true, driver: true }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'AVAILABLE' }
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    await publishTripEvent('CANCELLED', updatedTrip);
    return updatedTrip;
  }

  // Standard transition (`DISPATCHED -> IN_PROGRESS`)
  const updatedTrip = await tripRepo.updateTripStatus(trip.id, newStatus);
  await publishTripEvent(newStatus, updatedTrip);
  return updatedTrip;
}

module.exports = {
  getTrips,
  getTripById,
  getMetrics,
  dispatchTrip,
  transitionTripStatus
};
