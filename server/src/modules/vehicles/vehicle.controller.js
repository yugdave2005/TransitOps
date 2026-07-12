const vehicleService = require('./vehicle.service');

async function list(req, res, next) {
  try {
    const vehicles = await vehicleService.getAllVehicles(req.query);
    return res.status(200).json({ vehicles });
  } catch (err) {
    next(err);
  }
}

async function available(req, res, next) {
  try {
    const vehicles = await vehicleService.getAvailableVehicles(req.query.minCapacity);
    return res.status(200).json({ vehicles });
  } catch (err) {
    next(err);
  }
}

async function metrics(req, res, next) {
  try {
    const metrics = await vehicleService.getMetrics();
    return res.status(200).json({ metrics });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    return res.status(200).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    return res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    return res.status(200).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(req.params.id, req.body);
    return res.status(200).json({ vehicle });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    return res.status(200).json({ success: true, message: 'Vehicle deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  available,
  metrics,
  get,
  create,
  update,
  updateStatus,
  remove
};
