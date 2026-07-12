const prisma = require('../../config/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.search) {
    where.OR = [
      { stationName: { contains: filters.search, mode: 'insensitive' } },
      { vehicle: { registrationNo: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  return await prisma.fuelLog.findMany({
    where,
    include: {
      vehicle: { select: { id: true, registrationNo: true, type: true } },
      driver: { select: { id: true, name: true } }
    },
    orderBy: { date: 'desc' }
  });
}

async function create(data) {
  const totalCost = Number((data.liters * data.costPerLiter).toFixed(2));
  return await prisma.fuelLog.create({
    data: {
      ...data,
      totalCost
    },
    include: {
      vehicle: true,
      driver: true
    }
  });
}

async function getMetrics() {
  const [totalLogs, sumResult] = await Promise.all([
    prisma.fuelLog.count(),
    prisma.fuelLog.aggregate({
      _sum: { liters: true, totalCost: true }
    })
  ]);

  return {
    totalLogs,
    totalLiters: sumResult._sum.liters || 0,
    totalCost: sumResult._sum.totalCost || 0,
    avgCostPerLiter: (sumResult._sum.liters || 0) > 0 ? Number(((sumResult._sum.totalCost || 0) / sumResult._sum.liters).toFixed(2)) : 0
  };
}

module.exports = {
  findAll,
  create,
  getMetrics
};
