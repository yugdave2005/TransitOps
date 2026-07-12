import { z } from 'zod';

/**
 * Vehicle creation form validation
 */
export const vehicleSchema = z.object({
  registrationNo: z
    .string()
    .min(5, 'Registration number must be at least 5 characters')
    .max(15, 'Registration number is too long')
    .regex(/^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{1,4}$/, 'Format: XX-00-XX-0000 (e.g. MH-01-AB-1234)'),
  name: z
    .string()
    .min(3, 'Model name must be at least 3 characters')
    .max(100, 'Model name is too long'),
  type: z.enum(['TRUCK', 'VAN', 'BUS', 'CAR', 'MOTORCYCLE'], { message: 'Select a valid vehicle type' }),
  maxLoadCapacity: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(100, 'Minimum capacity is 100 kg')
    .max(100000, 'Maximum capacity is 1,00,000 kg'),
  odometer: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Odometer cannot be negative'),
  region: z.string().optional(),
  status: z.enum(['AVAILABLE', 'IN_SHOP', 'ON_TRIP']).optional(),
});

/**
 * Driver creation form validation
 */
export const driverSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long'),
  licenseNumber: z
    .string()
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number is too long'),
  licenseCategory: z.string().min(1, 'Select a license category'),
  licenseExpiry: z
    .string()
    .min(1, 'License expiry date is required')
    .refine((val) => new Date(val) > new Date(), 'License expiry must be a future date'),
  contactNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+91\s?\d{10}$|^\d{10}$/, 'Enter a valid Indian phone number (+91 XXXXXXXXXX)'),
  safetyScore: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Safety score cannot be below 0')
    .max(100, 'Safety score cannot exceed 100'),
});

/**
 * Trip dispatch form validation
 */
export const tripSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  origin: z
    .string()
    .min(3, 'Origin must be at least 3 characters'),
  destination: z
    .string()
    .min(3, 'Destination must be at least 3 characters'),
  cargoWeight: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Cargo weight must be at least 1 kg')
    .max(100000, 'Cargo weight cannot exceed 1,00,000 kg'),
  scheduledDeparture: z
    .string()
    .min(1, 'Scheduled departure is required'),
  scheduledArrival: z
    .string()
    .min(1, 'Scheduled arrival is required'),
});

/**
 * Fuel log form validation
 */
export const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  liters: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Minimum 1 litre')
    .max(2000, 'Maximum 2,000 litres'),
  costPerLiter: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(50, 'Minimum ₹50/litre')
    .max(200, 'Maximum ₹200/litre'),
  odometerReading: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Odometer cannot be negative'),
  stationName: z
    .string()
    .min(3, 'Station name must be at least 3 characters'),
});

/**
 * Expense form validation
 */
export const expenseSchema = z.object({
  category: z.enum(['TOLL', 'MAINTENANCE', 'FUEL', 'SALARY', 'INSURANCE', 'OTHER'], { message: 'Select a valid category' }),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Amount must be at least ₹1'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description is too long'),
});

/**
 * Maintenance form validation
 */
export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  title: z
    .string()
    .min(5, 'Repair title must be at least 5 characters')
    .max(200, 'Title is too long'),
  description: z.string().optional(),
  cost: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cost cannot be negative'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Select a valid priority' }),
});

/**
 * Helper to run Zod validation and return { success, data, errors }
 * errors is a map of fieldName -> error message
 */
export function validate(schema, formData) {
  const result = schema.safeParse(formData);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  const errors = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  });
  return { success: false, data: null, errors };
}
