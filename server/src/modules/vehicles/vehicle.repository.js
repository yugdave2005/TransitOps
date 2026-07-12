const prisma = require('../../config/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.region) where.region = { contains: filters.region, mode: 'insensitive' };
  if (filters.search) {
    where.OR = [
      { registrationNo: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

async function findById(id) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      maintenanceLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });
}

async function findByRegistration(registrationNo) {
  return prisma.vehicle.findUnique({
    where: { registrationNo }
  });
}

async function findAvailableForDispatch(minCapacity = 0) {
  return prisma.vehicle.findMany({
    where: {
      status: 'AVAILABLE',
      maxLoadCapacity: { gte: minCapacity }
    },
    orderBy: { maxLoadCapacity: 'asc' }
  });
}

async function create(data) {
  return prisma.vehicle.create({ data });
}

async function update(id, data) {
  return prisma.vehicle.update({
    where: { id },
    data
  });
}

async function remove(id) {
  return prisma.vehicle.delete({
    where: { id }
  });
}

async function getSummaryMetrics() {
  const [total, available, onTrip, inShop, retired] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { status: 'RETIRED' } })
  ]);

  return { total, available, onTrip, inShop, retired };
}

module.exports = {
  findAll,
  findById,
  findByRegistration,
  findAvailableForDispatch,
  create,
  update,
  remove,
  getSummaryMetrics
};
