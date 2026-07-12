const driverService = require('./driver.service');

async function list(req, res, next) {
  try {
    const drivers = await driverService.getAllDrivers(req.query);
    return res.status(200).json({ drivers });
  } catch (err) {
    next(err);
  }
}

async function available(req, res, next) {
  try {
    const drivers = await driverService.getAvailableDrivers();
    return res.status(200).json({ drivers });
  } catch (err) {
    next(err);
  }
}

async function complianceRisks(req, res, next) {
  try {
    const drivers = await driverService.getComplianceRisks();
    return res.status(200).json({ drivers });
  } catch (err) {
    next(err);
  }
}

async function metrics(req, res, next) {
  try {
    const metrics = await driverService.getMetrics();
    return res.status(200).json({ metrics });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    return res.status(200).json({ driver });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const driver = await driverService.createDriver(req.body);
    return res.status(201).json({ driver });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    return res.status(200).json({ driver });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const driver = await driverService.updateDriverStatus(req.params.id, req.body);
    return res.status(200).json({ driver });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await driverService.deleteDriver(req.params.id);
    return res.status(200).json({ success: true, message: 'Driver deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  available,
  complianceRisks,
  metrics,
  get,
  create,
  update,
  updateStatus,
  remove
};
