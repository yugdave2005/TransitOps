const prisma = require('../../config/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.licenseCategory) where.licenseCategory = { contains: filters.licenseCategory, mode: 'insensitive' };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { licenseNumber: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return prisma.driver.findMany({
    where,
    orderBy: { safetyScore: 'desc' }
  });
}

async function findById(id) {
  return prisma.driver.findUnique({
    where: { id },
    include: {
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });
}

async function findByLicense(licenseNumber) {
  return prisma.driver.findUnique({
    where: { licenseNumber }
  });
}

async function findAvailableAndCompliant() {
  const now = new Date();
  return prisma.driver.findMany({
    where: {
      status: 'AVAILABLE',
      licenseExpiry: { gt: now },
      safetyScore: { gte: 70 } // Minimum safety score required for dispatch
    },
    orderBy: { safetyScore: 'desc' }
  });
}

async function findComplianceRisks() {
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  return prisma.driver.findMany({
    where: {
      OR: [
        { licenseExpiry: { lte: thirtyDaysFromNow } }, // Expired or expiring within 30 days
        { safetyScore: { lt: 75 } },                  // Low safety score
        { status: 'SUSPENDED' }
      ]
    },
    orderBy: { safetyScore: 'asc' }
  });
}

async function create(data) {
  return prisma.driver.create({ data });
}

async function update(id, data) {
  return prisma.driver.update({
    where: { id },
    data
  });
}

async function remove(id) {
  return prisma.driver.delete({
    where: { id }
  });
}

async function getSummaryMetrics() {
  const [total, available, onTrip, offDuty, suspended, expiredCount] = await Promise.all([
    prisma.driver.count(),
    prisma.driver.count({ where: { status: 'AVAILABLE' } }),
    prisma.driver.count({ where: { status: 'ON_TRIP' } }),
    prisma.driver.count({ where: { status: 'OFF_DUTY' } }),
    prisma.driver.count({ where: { status: 'SUSPENDED' } }),
    prisma.driver.count({ where: { licenseExpiry: { lte: new Date() } } })
  ]);

  return { total, available, onTrip, offDuty, suspended, expiredCount };
}

module.exports = {
  findAll,
  findById,
  findByLicense,
  findAvailableAndCompliant,
  findComplianceRisks,
  create,
  update,
  remove,
  getSummaryMetrics
};
