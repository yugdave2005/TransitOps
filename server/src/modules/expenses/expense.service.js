const expenseRepo = require('./expense.repository');

async function getExpenses(filters) {
  return await expenseRepo.findAll(filters);
}

async function getMetrics() {
  return await expenseRepo.getMetrics();
}

async function logExpense(data) {
  return await expenseRepo.create({
    category: data.category,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    vehicleId: data.vehicleId || null,
    tripId: data.tripId || null
  });
}

module.exports = {
  getExpenses,
  getMetrics,
  logExpense
};
