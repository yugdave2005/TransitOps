const maintenanceService = require('./maintenance.service');
const { createMaintenanceLogSchema, updateMaintenanceStatusSchema } = require('./maintenance.validator');

async function listLogs(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      vehicleId: req.query.vehicleId,
      priority: req.query.priority,
      search: req.query.search
    };
    const logs = await maintenanceService.getLogs(filters);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await maintenanceService.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
}

async function getDetail(req, res, next) {
  try {
    const log = await maintenanceService.getLogById(req.params.id);
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
}

async function createLog(req, res, next) {
  try {
    const validated = createMaintenanceLogSchema.parse(req.body);
    const log = await maintenanceService.createLog(validated);
    res.status(201).json({
      success: true,
      message: 'Maintenance log created successfully. Vehicle locked to IN_SHOP.',
      log
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const validated = updateMaintenanceStatusSchema.parse(req.body);
    const log = await maintenanceService.updateLogStatus(req.params.id, validated.status, {
      cost: validated.cost,
      description: validated.description
    });
    res.json({
      success: true,
      message: `Shop repair transitioned to ${log.status}. Vehicle asset status updated.`,
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
  getDetail,
  createLog,
  changeStatus
};
