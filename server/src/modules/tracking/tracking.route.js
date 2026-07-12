const express = require('express');
const router = express.Router();
const trackingCtrl = require('./tracking.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');

router.get('/live', auth, trackingCtrl.getLiveTelemetry);
router.post('/simulate/toggle', auth, authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), trackingCtrl.toggleSimulator);

module.exports = router;
