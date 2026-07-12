const tripService = require('./trip.service');
const { createTripSchema, updateTripStatusSchema } = require('./trip.validator');

async function listTrips(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      vehicleId: req.query.vehicleId,
      driverId: req.query.driverId,
      search: req.query.search
    };
    const trips = await tripService.getTrips(filters);
    res.json({ success: true, count: trips.length, trips });
  } catch (err) {
    next(err);
  }
}

async function getTripMetrics(req, res, next) {
  try {
    const metrics = await tripService.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
}

async function getTripDetail(req, res, next) {
  try {
    const trip = await tripService.getTripById(req.params.id);
    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
}

async function dispatchTrip(req, res, next) {
  try {
    const validatedData = createTripSchema.parse(req.body);
    const trip = await tripService.dispatchTrip(validatedData);
    res.status(201).json({
      success: true,
      message: 'Trip dispatched successfully. Vehicle and driver status locked to ON_TRIP.',
      trip
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    next(err);
  }
}

async function changeTripStatus(req, res, next) {
  try {
    const validated = updateTripStatusSchema.parse(req.body);
    const trip = await tripService.transitionTripStatus(req.params.id, validated.status, {
      finalOdometer: validated.finalOdometer
    });
    res.json({
      success: true,
      message: `Trip transitioned to ${trip.status}. Asset statuses updated accordingly.`,
      trip
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    next(err);
  }
}

module.exports = {
  listTrips,
  getTripMetrics,
  getTripDetail,
  dispatchTrip,
  changeTripStatus
};
