const prisma = require('../../config/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.category) where.category = filters.category;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.tripId) where.tripId = filters.tripId;
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { vehicle: { registrationNo: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  return await prisma.expense.findMany({
    where,
    include: {
      vehicle: { select: { id: true, registrationNo: true, type: true } },
      trip: { select: { id: true, tripCode: true } }
    },
    orderBy: { date: 'desc' }
  });
}

async function create(data) {
  return await prisma.expense.create({
    data,
    include: {
      vehicle: true,
      trip: true
    }
  });
}

async function getMetrics() {
  const [totalExpenses, sumResult, byCategory] = await Promise.all([
    prisma.expense.count(),
    prisma.expense.aggregate({
      _sum: { amount: true }
    }),
    prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true }
    })
  ]);

  const categoryTotals = {};
  byCategory.forEach(c => {
    categoryTotals[c.category] = c._sum.amount || 0;
  });

  return {
    totalExpenses,
    totalAmount: sumResult._sum.amount || 0,
    categoryTotals
  };
}

module.exports = {
  findAll,
  create,
  getMetrics
};
