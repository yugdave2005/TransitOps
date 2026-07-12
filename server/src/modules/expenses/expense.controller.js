const expenseService = require('./expense.service');
const { createExpenseSchema } = require('./expense.validator');

async function listExpenses(req, res, next) {
  try {
    const filters = {
      category: req.query.category,
      vehicleId: req.query.vehicleId,
      tripId: req.query.tripId,
      search: req.query.search
    };
    const expenses = await expenseService.getExpenses(filters);
    res.json({ success: true, count: expenses.length, expenses });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await expenseService.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const validated = createExpenseSchema.parse(req.body);
    const expense = await expenseService.logExpense(validated);
    res.status(201).json({
      success: true,
      message: 'Expense entry logged into financial ledger successfully.',
      expense
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: err.errors[0].message });
    }
    next(err);
  }
}

module.exports = {
  listExpenses,
  getMetrics,
  createExpense
};
