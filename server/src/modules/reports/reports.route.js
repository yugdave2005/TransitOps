const express = require('express');
const router = express.Router();
const reportsCtrl = require('./reports.controller');
const auth = require('../../middleware/auth');

router.get('/overview', auth, reportsCtrl.getOverview);
router.get('/costs', auth, reportsCtrl.getCosts);
router.get('/safety', auth, reportsCtrl.getSafety);

module.exports = router;
