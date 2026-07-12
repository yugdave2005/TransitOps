const prisma = require('../../config/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { vehicle: { registrationNo: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  return await prisma.maintenanceLog.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNo: true, type: true, status: true, odometer: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function findById(id) {
  return await prisma.maintenanceLog.findUnique({
    where: { id },
    include: {
      vehicle: true
    }
  });
}

async function create(data) {
  return await prisma.maintenanceLog.create({
    data,
    include: {
      vehicle: true
    }
  });
}

async function updateStatus(id, status, extraData = {}) {
  return await prisma.maintenanceLog.update({
    where: { id },
    data: {
      status,
      ...extraData
    },
    include: {
      vehicle: true
    }
  });
}

async function getMetrics() {
  const [total, scheduled, inProgress, completed, totalCostResult] = await Promise.all([
    prisma.maintenanceLog.count(),
    prisma.maintenanceLog.count({ where: { status: 'SCHEDULED' } }),
    prisma.maintenanceLog.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.maintenanceLog.count({ where: { status: 'COMPLETED' } }),
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true }
    })
  ]);

  return {
    total,
    scheduled,
    inProgress,
    completed,
    totalCost: totalCostResult._sum.cost || 0
  };
}

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
  getMetrics
};
