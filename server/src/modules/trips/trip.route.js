const express = require('express');
const router = express.Router();
const tripCtrl = require('./trip.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');

// Public / Authenticated read endpoints
router.get('/', auth, tripCtrl.listTrips);
router.get('/metrics', auth, tripCtrl.getTripMetrics);
router.get('/:id', auth, tripCtrl.getTripDetail);

// Dispatch & lifecycle management endpoints (FLEET_MANAGER or SAFETY_OFFICER or DRIVER for completion)
router.post('/', auth, authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), tripCtrl.dispatchTrip);
router.patch('/:id/status', auth, authorize('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER'), tripCtrl.changeTripStatus);

module.exports = router;
