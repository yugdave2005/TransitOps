const express = require('express');
const router = express.Router();
const fuelCtrl = require('./fuel.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');

router.get('/', auth, fuelCtrl.listLogs);
router.get('/metrics', auth, fuelCtrl.getMetrics);

router.post('/', auth, authorize('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER'), fuelCtrl.createLog);

module.exports = router;
