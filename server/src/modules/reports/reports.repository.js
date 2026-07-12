const prisma = require('../../config/prisma');

async function getFleetStatusDistribution() {
  const grouped = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const counts = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
  grouped.forEach(g => {
    if (counts.hasOwnProperty(g.status)) {
      counts[g.status] = g._count.id;
    }
  });

  return [
    { name: 'Available', status: 'AVAILABLE', count: counts.AVAILABLE, color: '#28a745' },
    { name: 'On Trip', status: 'ON_TRIP', count: counts.ON_TRIP, color: '#007bff' },
    { name: 'In Shop', status: 'IN_SHOP', count: counts.IN_SHOP, color: '#fd7e14' },
    { name: 'Retired', status: 'RETIRED', count: counts.RETIRED, color: '#dc3545' }
  ];
}

async function getExpenseCategoryBreakdown() {
  const grouped = await prisma.expense.groupBy({
    by: ['category'],
    _sum: { amount: true }
  });

  const categories = ['TOLL', 'MAINTENANCE', 'FUEL', 'SALARY', 'INSURANCE', 'OTHER'];
  const colorMap = {
    TOLL: '#714B67',
    MAINTENANCE: '#fd7e14',
    FUEL: '#007bff',
    SALARY: '#28a745',
    INSURANCE: '#6f42c1',
    OTHER: '#6c757d'
  };

  return categories.map(cat => {
    const match = grouped.find(g => g.category === cat);
    return {
      category: cat,
      amount: match ? (match._sum.amount || 0) : 0,
      color: colorMap[cat]
    };
  });
}

async function getTripPerformanceMetrics() {
  const [totalTrips, completed, inProgress, cancelled, delayed] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({ where: { status: 'COMPLETED' } }),
    prisma.trip.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.trip.count({ where: { status: 'CANCELLED' } }),
    prisma.trip.count({ where: { isDelayed: true } })
  ]);

  const onTimeRate = completed > 0 ? Math.round(((completed - delayed) / completed) * 100) : 100;

  return {
    totalTrips,
    completed,
    inProgress,
    cancelled,
    delayed,
    onTimeRate: Math.max(0, Math.min(100, onTimeRate))
  };
}

async function getTopDriverSafetyScores(limit = 6) {
  const drivers = await prisma.driver.findMany({
    where: { status: { not: 'SUSPENDED' } },
    select: {
      id: true,
      name: true,
      licenseNumber: true,
      safetyScore: true,
      status: true
    },
    orderBy: { safetyScore: 'desc' },
    take: limit
  });
  
  return drivers.map(d => ({
    id: d.id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    licenseNo: d.licenseNumber,
    safetyScore: d.safetyScore,
    status: d.status
  }));
}

async function getDailyExpenseTrend(days = 14) {
  // Fetch recent expenses and aggregate by date string
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: cutoff } },
    select: { date: true, amount: true, category: true }
  });

  const fuelLogs = await prisma.fuelLog.findMany({
    where: { date: { gte: cutoff } },
    select: { date: true, totalCost: true }
  });

  const trendMap = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    trendMap[dateStr] = { date: dateStr, expenses: 0, fuel: 0, total: 0 };
  }

  expenses.forEach(e => {
    const ds = new Date(e.date).toISOString().split('T')[0];
    if (trendMap[ds]) {
      trendMap[ds].expenses += e.amount;
      trendMap[ds].total += e.amount;
    }
  });

  fuelLogs.forEach(f => {
    const ds = new Date(f.date).toISOString().split('T')[0];
    if (trendMap[ds]) {
      trendMap[ds].fuel += f.totalCost;
      trendMap[ds].total += f.totalCost;
    }
  });

  return Object.values(trendMap).map(t => ({
    date: t.date,
    expenses: Number(t.expenses.toFixed(2)),
    fuel: Number(t.fuel.toFixed(2)),
    total: Number(t.total.toFixed(2))
  }));
}

module.exports = {
  getFleetStatusDistribution,
  getExpenseCategoryBreakdown,
  getTripPerformanceMetrics,
  getTopDriverSafetyScores,
  getDailyExpenseTrend
};
