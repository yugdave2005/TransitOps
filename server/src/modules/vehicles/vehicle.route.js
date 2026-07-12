const express = require('express');
const router = express.Router();
const vehicleController = require('./vehicle.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const validate = require('../../middleware/validate');
const { createVehicleSchema, updateVehicleSchema, updateVehicleStatusSchema } = require('./vehicle.validator');

// All endpoints require auth
router.use(auth);

router.get('/', vehicleController.list);
router.get('/available', vehicleController.available);
router.get('/metrics', vehicleController.metrics);
router.get('/:id', vehicleController.get);

// Manager & Safety Officer can manage vehicles
router.post('/', authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), validate(createVehicleSchema), vehicleController.create);
router.patch('/:id', authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), validate(updateVehicleSchema), vehicleController.update);
router.patch('/:id/status', authorize('FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'), validate(updateVehicleStatusSchema), vehicleController.updateStatus);
router.delete('/:id', authorize('FLEET_MANAGER'), vehicleController.remove);

module.exports = router;
