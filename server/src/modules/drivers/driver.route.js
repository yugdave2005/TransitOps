const express = require('express');
const router = express.Router();
const driverController = require('./driver.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const { createDriverSchema, updateDriverSchema, updateDriverStatusSchema } = require('./driver.validator');

// All endpoints require auth
router.use(auth);

router.get('/', driverController.list);
router.get('/available', driverController.available);
router.get('/compliance', driverController.complianceRisks);
router.get('/metrics', driverController.metrics);
router.get('/:id', driverController.get);

// Manager & Safety Officer can manage drivers
router.post('/', authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), validate(createDriverSchema), driverController.create);
router.patch('/:id', authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), validate(updateDriverSchema), driverController.update);
router.patch('/:id/status', authorize('FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'), validate(updateDriverStatusSchema), driverController.updateStatus);
router.delete('/:id', authorize('FLEET_MANAGER'), driverController.remove);

module.exports = router;
