const { getIO } = require('../config/socket');
const reportsService = require('../modules/reports/reports.service');

let analyticsTimer = null;

function startAnalyticsWorker() {
  if (analyticsTimer) clearInterval(analyticsTimer);

  console.log('✅ [analytics.worker] Background analytics engine started (15s broadcast loop)');

  analyticsTimer = setInterval(async () => {
    try {
      const io = getIO();
      if (!io) return;

      const overview = await reportsService.getDashboardOverview();
      io.emit('analytics:updated', { overview });
    } catch (err) {
      console.error('❌ [analytics.worker] Error generating live analytics snapshot:', err.message);
    }
  }, 15000);
}

module.exports = {
  startAnalyticsWorker
};
