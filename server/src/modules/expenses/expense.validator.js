const { z } = require('zod');

const createExpenseSchema = z.object({
  category: z.enum(['TOLL', 'MAINTENANCE', 'FUEL', 'SALARY', 'INSURANCE', 'OTHER']),
  amount: z.number().positive('Expense amount must be positive'),
  date: z.string().datetime().optional(),
  description: z.string().min(2, 'Description required'),
  vehicleId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable()
});

module.exports = {
  createExpenseSchema
};
