const express = require('express');
const router = express.Router();
const expenseCtrl = require('./expense.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');

router.get('/', auth, expenseCtrl.listExpenses);
router.get('/metrics', auth, expenseCtrl.getMetrics);

router.post('/', auth, authorize('FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'), expenseCtrl.createExpense);

module.exports = router;
