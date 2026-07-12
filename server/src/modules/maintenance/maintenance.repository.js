const prisma = require('../../config/prisma');

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
  return {
    ...log,
    status: mapStatusDbToFrontend(log.status)
  };
}

async function findAll(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = mapStatusFrontendToDb(filters.status);
  }
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { vehicle: { registrationNo: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  const logs = await prisma.maintenanceLog.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNo: true, type: true, status: true, odometer: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return logs.map(mapLog);
}

async function findById(id) {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: {
      vehicle: true
    }
  });
  return mapLog(log);
}

async function create(data) {
  const log = await prisma.maintenanceLog.create({
    data: {
      ...data,
      status: mapStatusFrontendToDb(data.status)
    },
    include: {
      vehicle: true
    }
  });
  return mapLog(log);
}

async function updateStatus(id, status, extraData = {}) {
  const log = await prisma.maintenanceLog.update({
    where: { id },
    data: {
      status: mapStatusFrontendToDb(status),
      ...extraData
    },
    include: {
      vehicle: true
    }
  });
  return mapLog(log);
}

async function getMetrics() {
  const [total, scheduled, inProgress, completed, totalCostResult] = await Promise.all([
    prisma.maintenanceLog.count(),
    prisma.maintenanceLog.count({ where: { status: 'OPEN' } }),
    prisma.maintenanceLog.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.maintenanceLog.count({ where: { status: 'CLOSED' } }),
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
