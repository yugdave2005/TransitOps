const reportsRepo = require('./reports.repository');

async function getDashboardOverview() {
  const [fleetStatus, expenseBreakdown, tripMetrics, safetyLeaders, dailyTrend] = await Promise.all([
    reportsRepo.getFleetStatusDistribution(),
    reportsRepo.getExpenseCategoryBreakdown(),
    reportsRepo.getTripPerformanceMetrics(),
    reportsRepo.getTopDriverSafetyScores(6),
    reportsRepo.getDailyExpenseTrend(14)
  ]);

  const totalVehicles = fleetStatus.reduce((acc, curr) => acc + curr.count, 0);
  const totalExpenses = expenseBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

  return {
    timestamp: new Date().toISOString(),
    kpi: {
      totalVehicles,
      activeEnRoute: fleetStatus.find(f => f.status === 'ON_TRIP')?.count || 0,
      inShopCount: fleetStatus.find(f => f.status === 'IN_SHOP')?.count || 0,
      totalTrips: tripMetrics.totalTrips,
      onTimeRate: tripMetrics.onTimeRate,
      totalExpenses: Number(totalExpenses.toFixed(2))
    },
    fleetStatus,
    expenseBreakdown,
    tripMetrics,
    safetyLeaders,
    dailyTrend
  };
}

async function getCostAnalytics() {
  const [breakdown, trend] = await Promise.all([
    reportsRepo.getExpenseCategoryBreakdown(),
    reportsRepo.getDailyExpenseTrend(30)
  ]);

  const totalCost = breakdown.reduce((acc, curr) => acc + curr.amount, 0);
  return { breakdown, trend, totalCost: Number(totalCost.toFixed(2)) };
}

async function getSafetyAnalytics() {
  const leaders = await reportsRepo.getTopDriverSafetyScores(20);
  const avgScore = leaders.length > 0
    ? Math.round(leaders.reduce((acc, curr) => acc + curr.safetyScore, 0) / leaders.length)
    : 100;
  return { leaders, avgScore };
}

module.exports = {
  getDashboardOverview,
  getCostAnalytics,
  getSafetyAnalytics
};
