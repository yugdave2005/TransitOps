const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding...');

  // Clean up existing data in reverse relation order
  await prisma.telemetryLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Old records cleared.');

  // 1. Seed Users (All roles)
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const fleetManager = await prisma.user.create({
    data: {
      email: 'fleet_mgr@transitops.com',
      passwordHash,
      name: 'Vikram Mehta (Fleet Manager)',
      role: 'FLEET_MANAGER'
    }
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@transitops.com',
      passwordHash,
      name: 'Alex Kumar (Driver)',
      role: 'DRIVER'
    }
  });

  const safetyOfficer = await prisma.user.create({
    data: {
      email: 'safety@transitops.com',
      passwordHash,
      name: 'Priya Sharma (Safety Officer)',
      role: 'SAFETY_OFFICER'
    }
  });

  const financialAnalyst = await prisma.user.create({
    data: {
      email: 'analyst@transitops.com',
      passwordHash,
      name: 'Rohan Gupta (Financial Analyst)',
      role: 'FINANCIAL_ANALYST'
    }
  });

  console.log('[Seed] Created 4 Users (Fleet Manager, Driver, Safety Officer, Financial Analyst)');

  // 2. Seed Vehicles
  const truck1 = await prisma.vehicle.create({
    data: {
      registrationNo: 'KA-01-AB-1234',
      name: 'Tata Signo 4825.T Heavy Truck',
      type: 'TRUCK',
      maxLoadCapacity: 25000,
      odometer: 45200,
      acquisitionCost: 4500000,
      status: 'AVAILABLE',
      region: 'South',
      currentLat: 12.9716,
      currentLng: 77.5946
    }
  });

  const truck2 = await prisma.vehicle.create({
    data: {
      registrationNo: 'DL-04-GH-5678',
      name: 'Ashok Leyland Ecomet 1615',
      type: 'TRUCK',
      maxLoadCapacity: 16000,
      odometer: 89300,
      acquisitionCost: 3200000,
      status: 'ON_TRIP',
      region: 'North',
      currentLat: 28.6139,
      currentLng: 77.2090
    }
  });

  const van1 = await prisma.vehicle.create({
    data: {
      registrationNo: 'MH-12-PQ-9012',
      name: 'Mahindra Bolero Maxi Truck Plus',
      type: 'VAN',
      maxLoadCapacity: 1200,
      odometer: 112400,
      acquisitionCost: 850000,
      status: 'IN_SHOP',
      region: 'West',
      currentLat: 19.0760,
      currentLng: 72.8777
    }
  });

  const van2 = await prisma.vehicle.create({
    data: {
      registrationNo: 'KA-05-XY-3456',
      name: 'Force Traveller Express Van',
      type: 'VAN',
      maxLoadCapacity: 2000,
      odometer: 32100,
      acquisitionCost: 1400000,
      status: 'AVAILABLE',
      region: 'South',
      currentLat: 12.9716,
      currentLng: 77.5946
    }
  });

  const bus1 = await prisma.vehicle.create({
    data: {
      registrationNo: 'HR-26-MN-7890',
      name: 'Volvo 9400 Intercity Bus',
      type: 'BUS',
      maxLoadCapacity: 8000,
      odometer: 215000,
      acquisitionCost: 11000000,
      status: 'AVAILABLE',
      region: 'North',
      currentLat: 28.4595,
      currentLng: 77.0266
    }
  });

  const retiredTruck = await prisma.vehicle.create({
    data: {
      registrationNo: 'TN-09-OLD-0001',
      name: 'Tata LPT 1109 Legacy Truck',
      type: 'TRUCK',
      maxLoadCapacity: 11000,
      odometer: 450000,
      acquisitionCost: 1800000,
      status: 'RETIRED',
      region: 'South'
    }
  });

  console.log('[Seed] Created 6 Vehicles across TRUCK, VAN, BUS types');

  // 3. Seed Drivers
  const driverAlex = await prisma.driver.create({
    data: {
      name: 'Alex Kumar',
      licenseNumber: 'DL-2018-9876543',
      licenseCategory: 'CE (Heavy Trailer)',
      licenseExpiry: new Date('2028-10-15'),
      contactNumber: '+91 98765 43210',
      safetyScore: 94.5,
      status: 'ON_TRIP'
    }
  });

  const driverSuresh = await prisma.driver.create({
    data: {
      name: 'Suresh Patil',
      licenseNumber: 'KA-2015-1234567',
      licenseCategory: 'C (Heavy Rigid Truck)',
      licenseExpiry: new Date('2027-05-20'),
      contactNumber: '+91 98123 45678',
      safetyScore: 98.0,
      status: 'AVAILABLE'
    }
  });

  const driverManoj = await prisma.driver.create({
    data: {
      name: 'Manoj Tiwari',
      licenseNumber: 'MH-2019-5555555',
      licenseCategory: 'D (Heavy Bus)',
      licenseExpiry: new Date('2029-12-01'),
      contactNumber: '+91 99988 77766',
      safetyScore: 89.0,
      status: 'AVAILABLE'
    }
  });

  const driverExpired = await prisma.driver.create({
    data: {
      name: 'Ram Singh (Expired License)',
      licenseNumber: 'UP-2010-0001111',
      licenseCategory: 'CE',
      licenseExpiry: new Date('2023-01-01'), // Expired!
      contactNumber: '+91 97777 66666',
      safetyScore: 75.0,
      status: 'AVAILABLE'
    }
  });

  const driverSuspended = await prisma.driver.create({
    data: {
      name: 'Deepak Verma (Suspended)',
      licenseNumber: 'RJ-2016-4443333',
      licenseCategory: 'C',
      licenseExpiry: new Date('2028-06-15'),
      contactNumber: '+91 96666 55555',
      safetyScore: 45.0,
      status: 'SUSPENDED'
    }
  });

  console.log('[Seed] Created 5 Drivers with active, expired, and suspended states');

  // 4. Seed Trips
  // Dispatched active trip (with coords for OSM simulation)
  const activeTrip = await prisma.trip.create({
    data: {
      source: 'Delhi Hub (New Delhi)',
      destination: 'Jaipur Logistics Center',
      cargoWeight: 14500,
      plannedDistance: 280,
      status: 'DISPATCHED',
      sourceLat: 28.6139,
      sourceLng: 77.2090,
      destLat: 26.9124,
      destLng: 75.7873,
      vehicleId: truck2.id,
      driverId: driverAlex.id,
      dispatchedAt: new Date(Date.now() - 3 * 3600 * 1000) // 3 hours ago
    }
  });

  // Draft trip
  await prisma.trip.create({
    data: {
      source: 'Bangalore Electronic City',
      destination: 'Chennai Port',
      cargoWeight: 18000,
      plannedDistance: 345,
      status: 'DRAFT',
      sourceLat: 12.9716,
      sourceLng: 77.5946,
      destLat: 13.0827,
      destLng: 80.2707,
      vehicleId: truck1.id,
      driverId: driverSuresh.id
    }
  });

  // Completed trip
  await prisma.trip.create({
    data: {
      source: 'Mumbai Port',
      destination: 'Pune Industrial Area',
      cargoWeight: 1100,
      plannedDistance: 155,
      actualDistance: 162.5,
      fuelConsumed: 22.4,
      revenue: 18500,
      status: 'COMPLETED',
      sourceLat: 19.0760,
      sourceLng: 72.8777,
      destLat: 18.5204,
      destLng: 73.8567,
      vehicleId: van1.id,
      driverId: driverManoj.id,
      dispatchedAt: new Date(Date.now() - 48 * 3600 * 1000),
      completedAt: new Date(Date.now() - 43 * 3600 * 1000)
    }
  });

  // Cancelled trip
  await prisma.trip.create({
    data: {
      source: 'Bangalore Hub',
      destination: 'Mysore Depot',
      cargoWeight: 800,
      plannedDistance: 145,
      status: 'CANCELLED',
      vehicleId: van2.id,
      driverId: driverSuresh.id,
      cancelledAt: new Date(Date.now() - 72 * 3600 * 1000)
    }
  });

  console.log('[Seed] Created 4 Trips across Dispatched, Draft, Completed, and Cancelled states');

  // 5. Seed Maintenance Logs
  await prisma.maintenanceLog.create({
    data: {
      description: 'Engine transmission check and oil filter replacement',
      cost: 14500,
      status: 'IN_PROGRESS',
      scheduledDate: new Date(),
      vehicleId: van1.id
    }
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Brake pad replacement and alignment service',
      cost: 8200,
      status: 'CLOSED',
      scheduledDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      completedDate: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      vehicleId: truck1.id
    }
  });

  console.log('[Seed] Created 2 Maintenance Logs');

  // 6. Seed Fuel Logs & Expenses
  await prisma.fuelLog.create({
    data: {
      liters: 140.5,
      cost: 13250,
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      odometer: 44800,
      vehicleId: truck1.id
    }
  });

  await prisma.fuelLog.create({
    data: {
      liters: 95.0,
      cost: 8960,
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      odometer: 89100,
      vehicleId: truck2.id
    }
  });

  await prisma.expense.create({
    data: {
      category: 'TOLL',
      description: 'National Highway Fastag Toll Charges',
      amount: 1450,
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      vehicleId: truck2.id
    }
  });

  await prisma.expense.create({
    data: {
      category: 'INSURANCE',
      description: 'Annual Comprehensive Vehicle Insurance Premium',
      amount: 45000,
      date: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      vehicleId: truck1.id
    }
  });

  console.log('[Seed] Created Fuel Logs and Expenses');

  // 7. Seed Telemetry Logs (Live GPS positions along route)
  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    await prisma.telemetryLog.create({
      data: {
        latitude: 28.6139 - (i * 0.05),
        longitude: 77.2090 - (i * 0.03),
        speed: 62.4 + (i * 2.1),
        heading: 210,
        timestamp: new Date(now - (5 - i) * 15 * 60 * 1000), // Every 15 minutes leading up to now
        vehicleId: truck2.id
      }
    });
  }

  console.log('[Seed] Created historical Telemetry Logs for active vehicle');
  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
