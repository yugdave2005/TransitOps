const prisma = require('../../config/prisma');

async function findAllTrips(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.search) {
    where.OR = [
      { tripCode: { contains: filters.search, mode: 'insensitive' } },
      { origin: { contains: filters.search, mode: 'insensitive' } },
      { destination: { contains: filters.search, mode: 'insensitive' } },
      { vehicle: { registrationNo: { contains: filters.search, mode: 'insensitive' } } },
      { driver: { name: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  return await prisma.trip.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNo: true, type: true, maxLoadCapacity: true, status: true, odometer: true }
      },
      driver: {
        select: { id: true, name: true, licenseNumber: true, licenseCategory: true, safetyScore: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function findTripById(id) {
  return await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true
    }
  });
}

async function findActiveTripByVehicleId(vehicleId) {
  return await prisma.trip.findFirst({
    where: {
      vehicleId,
      status: { in: ['DISPATCHED', 'IN_PROGRESS'] }
    }
  });
}

async function findActiveTripByDriverId(driverId) {
  return await prisma.trip.findFirst({
    where: {
      driverId,
      status: { in: ['DISPATCHED', 'IN_PROGRESS'] }
    }
  });
}

async function createTrip(data) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const tripCode = `TRP-${timestamp}-${randomSuffix}`;

  return await prisma.trip.create({
    data: { ...data, tripCode },
    include: {
      vehicle: true,
      driver: true
    }
  });
}

async function updateTripStatus(id, status, extraData = {}) {
  return await prisma.trip.update({
    where: { id },
    data: {
      status,
      ...extraData
    },
    include: {
      vehicle: true,
      driver: true
    }
  });
}

async function getTripMetrics() {
  const [total, dispatched, inProgress, completed, cancelled] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    prisma.trip.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.trip.count({ where: { status: 'COMPLETED' } }),
    prisma.trip.count({ where: { status: 'CANCELLED' } })
  ]);

  return { total, dispatched, inProgress, completed, cancelled };
}

module.exports = {
  findAllTrips,
  findTripById,
  findActiveTripByVehicleId,
  findActiveTripByDriverId,
  createTrip,
  updateTripStatus,
  getTripMetrics
};
