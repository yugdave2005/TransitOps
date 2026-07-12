const express = require('express');
const router = express.Router();
const maintenanceCtrl = require('./maintenance.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');

router.get('/', auth, maintenanceCtrl.listLogs);
router.get('/metrics', auth, maintenanceCtrl.getMetrics);
router.get('/:id', auth, maintenanceCtrl.getDetail);

router.post('/', auth, authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), maintenanceCtrl.createLog);
router.patch('/:id/status', auth, authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), maintenanceCtrl.changeStatus);

module.exports = router;
