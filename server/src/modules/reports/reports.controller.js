const reportsService = require('./reports.service');

async function getOverview(req, res, next) {
  try {
    const data = await reportsService.getDashboardOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getCosts(req, res, next) {
  try {
    const data = await reportsService.getCostAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSafety(req, res, next) {
  try {
    const data = await reportsService.getSafetyAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getCosts,
  getSafety
};
