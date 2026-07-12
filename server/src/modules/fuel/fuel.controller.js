const fuelService = require('./fuel.service');
const { createFuelLogSchema } = require('./fuel.validator');

async function listLogs(req, res, next) {
  try {
    const filters = {
      vehicleId: req.query.vehicleId,
      driverId: req.query.driverId,
      search: req.query.search
    };
    const logs = await fuelService.getLogs(filters);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await fuelService.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
}

async function createLog(req, res, next) {
  try {
    const validated = createFuelLogSchema.parse(req.body);
    const log = await fuelService.logFuel(validated);
    res.status(201).json({
      success: true,
      message: 'Fuel fill-up recorded successfully.',
      log
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    next(err);
  }
}

module.exports = {
  listLogs,
  getMetrics,
  createLog
};
