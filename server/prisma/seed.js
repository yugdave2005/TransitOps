const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(days, fromDate = new Date()) {
  return new Date(fromDate.getTime() - days * 24 * 3600 * 1000);
}

// ─── India-Wide Data Pools ──────────────────────────────────────────────────────

const INDIA_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3090 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 }
];

const LOCATION_SUFFIXES = [
  'Hub', 'Logistics Center', 'Warehouse', 'Industrial Area',
  'Distribution Center', 'Depot', 'Terminal', 'Freight Yard',
  'Container Yard', 'Loading Point', 'Transit Hub', 'GIDC',
  'SEZ', 'Cargo Terminal', 'Storage Complex',
];

const FUEL_STATIONS = [
  'Indian Oil - Ahmedabad Highway', 'Bharat Petroleum - SG Highway',
  'Hindustan Petroleum - Vadodara', 'Reliance Fuel Stop - Surat',
  'Shell Express - Gandhinagar', 'Essar Fuel - Rajkot',
  'HP Petrol Pump - Anand', 'IOCL Highway Point - Bharuch',
  'BPCL Truck Fueling - Morbi', 'Nayara Energy - Jamnagar',
  'Adani Gas Station - Mundra', 'City Fuel - Bhavnagar',
  'National Fuel Stop - Mehsana', 'Express Petroleum - Junagadh',
  'Highway Fuel Center - Navsari', 'Quick Fill - Nadiad',
  'Metro Fuels - Valsad', 'Greenway Fuel - Palanpur',
  'Gujarat Petro - Kutch Highway', 'GSPC Gas Station - Dahod',
];

const MAINTENANCE_DESCRIPTIONS = [
  'Engine oil change and filter replacement',
  'Brake pad replacement and disc resurfacing',
  'Transmission fluid flush and top-up',
  'Air filter and cabin filter replacement',
  'Full suspension inspection and shock absorber replacement',
  'Battery replacement and electrical system check',
  'Clutch plate replacement and adjustment',
  'Tyre rotation, balancing, and alignment',
  'Radiator coolant flush and thermostat check',
  'AC compressor repair and gas refill',
  'Wheel bearing replacement (front axle)',
  'Power steering fluid replacement',
  'Exhaust system inspection and muffler replacement',
  'Alternator belt replacement',
  'Full brake hydraulic system overhaul',
  'Windshield wiper motor and blade replacement',
  'Differential oil change (rear axle)',
  'Fuel injector cleaning and calibration',
  'Turbocharger inspection and seal replacement',
  'Starter motor rebuild and solenoid replacement',
  'Head gasket replacement',
  'Timing chain/belt replacement',
  'Complete engine tune-up',
  'Propeller shaft balancing and U-joint replacement',
  'LED headlight conversion and wiring overhaul',
  'ABS module diagnostic and repair',
  'PTO (Power Take-Off) servicing',
  'Chassis lubrication and undercoat treatment',
  'Emergency roadside repair — tyre blowout',
  'Catalytic converter replacement',
];

// ─── Expense descriptions — uses [Cat: CATEGORY] prefix for the dashboard ─────
// Dashboard categories: TOLL, MAINTENANCE, FUEL, SALARY, INSURANCE, OTHER
// DB enum only has: TOLL, PARKING, REPAIR, INSURANCE, OTHER
// So we embed the REAL category in the description via [Cat: X] prefix

const EXPENSE_TEMPLATES = {
  TOLL: {
    dbCategory: 'TOLL', // direct map
    descriptions: [
      'Ahmedabad-Vadodara Expressway toll', 'NH-48 Fastag charges',
      'Rajkot-Jamnagar highway toll', 'Surat-Bharuch NH toll',
      'Gandhinagar Ring Road toll', 'Bhavnagar-Rajkot toll',
      'Kutch-Ahmedabad highway toll', 'Morbi-Rajkot expressway toll',
      'Mehsana-Palanpur NH toll', 'Vadodara-Surat expressway toll',
      'Navsari-Valsad coastal highway toll', 'Anand-Nadiad bypass toll',
    ],
    amountRange: [150, 4500],
  },
  MAINTENANCE: {
    dbCategory: 'REPAIR', // maps to REPAIR in DB
    descriptions: [
      'Scheduled engine service at Tata workshop', 'Brake system overhaul',
      'Transmission repair at Ahmedabad garage', 'Suspension work at Surat center',
      'AC compressor replacement', 'Clutch assembly repair',
      'Steering rack replacement', 'Exhaust system repair',
      'Electrical wiring fix', 'Radiator replacement and flush',
    ],
    amountRange: [3000, 45000],
  },
  FUEL: {
    dbCategory: 'OTHER', // maps to OTHER in DB
    descriptions: [
      'Diesel refill — Ahmedabad depot', 'Fuel top-up — Surat highway',
      'Emergency fuel — Kutch route', 'Diesel — Vadodara GIDC trip',
      'Fuel refill — Rajkot transit', 'Diesel — Gandhinagar depot',
      'Fuel — Jamnagar port run', 'Diesel top-up — Bharuch',
      'Fuel — Morbi ceramics delivery', 'Diesel — Bhavnagar port route',
    ],
    amountRange: [2000, 25000],
  },
  SALARY: {
    dbCategory: 'OTHER', // maps to OTHER in DB
    descriptions: [
      'Driver daily wage — local delivery', 'Driver allowance — long-haul trip',
      'Helper wages — loading/unloading', 'Overtime pay — night shift',
      'Driver bonus — safe delivery', 'Cleaner wages — vehicle wash duty',
      'Relief driver wages', 'Driver food and stay allowance',
    ],
    amountRange: [500, 8000],
  },
  INSURANCE: {
    dbCategory: 'INSURANCE', // direct map
    descriptions: [
      'Annual comprehensive vehicle insurance', 'Third-party liability insurance renewal',
      'Goods-in-transit insurance premium', 'Fleet insurance bundle (quarterly)',
      'Driver personal accident insurance', 'Motor accident claim deductible',
    ],
    amountRange: [15000, 85000],
  },
  OTHER: {
    dbCategory: 'OTHER', // direct map
    descriptions: [
      'Vehicle cleaning and wash', 'GPS tracker maintenance fee',
      'Fitness certificate renewal', 'PUC certificate fee',
      'Road tax renewal', 'State border permit fee',
      'Weighbridge charges', 'Loading/unloading labor',
      'Documentation and challan fees', 'Parking charges',
      'Vehicle registration renewal', 'Driver safety gear',
    ],
    amountRange: [200, 12000],
  },
};

const VEHICLE_NAMES = {
  TRUCK: [
    'Tata Signa 4825.T', 'Tata Prima 4028.S', 'Ashok Leyland Ecomet 1615',
    'Ashok Leyland Captain 2523', 'BharatBenz 3523R', 'BharatBenz 1617R',
    'Eicher Pro 6049', 'Eicher Pro 3019', 'Volvo FM 420',
    'Scania R500', 'MAN CLA 31.300', 'Tata LPT 3521',
  ],
  VAN: [
    'Mahindra Bolero Maxi Truck Plus', 'Force Traveller Express',
    'Tata Ace Gold', 'Tata Intra V30', 'Ashok Leyland Dost Plus',
    'Mahindra Supro Profitmaxx', 'Piaggio Ape Xtra Dlx',
    'Maruti Suzuki Super Carry', 'Tata Magic Express',
  ],
  BUS: [
    'Volvo 9400 Intercity', 'Ashok Leyland Viking',
    'Tata Starbus Ultra', 'BharatBenz 917 Staff Bus',
    'Eicher Skyline Pro Staff', 'SML Isuzu S7',
  ],
  CAR: [
    'Maruti Suzuki Dzire', 'Hyundai Verna', 'Toyota Innova Crysta',
    'Mahindra XUV700', 'Tata Nexon', 'Honda City',
  ],
  MOTORCYCLE: [
    'Hero Splendor Plus', 'Honda CB Shine', 'Bajaj Pulsar 150',
    'TVS Apache RTR 160', 'Royal Enfield Classic 350',
  ],
};

const INDIA_RTOS = [
  'MH-01', 'MH-02', 'DL-01', 'DL-02', 'KA-01', 'KA-03', 'TN-01', 'TN-03',
  'GJ-01', 'GJ-02', 'RJ-14', 'UP-16', 'UP-32', 'WB-01', 'TS-09', 'AP-01',
  'KL-07', 'AS-01', 'OD-02', 'HR-26', 'PB-02', 'MP-04', 'BR-01', 'JH-01'
];

const FIRST_NAMES = [
  'Rajesh', 'Vikram', 'Suresh', 'Manoj', 'Priya', 'Anita', 'Kiran',
  'Deepak', 'Amit', 'Sandeep', 'Ramesh', 'Arjun', 'Ravi', 'Sanjay',
  'Pooja', 'Rohit', 'Naveen', 'Aakash', 'Gaurav', 'Neha', 'Harish',
  'Vijay', 'Lakshmi', 'Gopal', 'Sunil', 'Ajay', 'Dinesh', 'Mohan',
  'Pankaj', 'Yogesh',
];

const LAST_NAMES = [
  'Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Trivedi', 'Bhatt',
  'Pandya', 'Parmar', 'Solanki', 'Raval', 'Modi', 'Chauhan', 'Thakkar',
  'Gajjar', 'Dave', 'Vyas', 'Rana', 'Makwana', 'Suthar',
  'Chaudhary', 'Darji', 'Nagar', 'Barot', 'Soni',
];

const LICENSE_CATEGORIES = [
  'CE (Heavy Trailer)', 'C (Heavy Rigid Truck)', 'D (Heavy Bus)',
  'LMV (Light Motor Vehicle)', 'MCWG (Motorcycle With Gear)',
];

// ─── Main Seed Function ─────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     TransitOps — Gujarat Fleet Database Seeding            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Clean up
  console.log('[1/8] Clearing existing data...');
  await prisma.telemetryLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✔ All existing records removed.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. USERS (10)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[2/8] Seeding Users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    { email: 'fleet_mgr@transitops.com', name: 'Vikram Mehta', role: 'FLEET_MANAGER' },
    { email: 'fleet_mgr2@transitops.com', name: 'Anita Desai', role: 'FLEET_MANAGER' },
    { email: 'driver1@transitops.com', name: 'Rajesh Patel', role: 'DRIVER' },
    { email: 'driver2@transitops.com', name: 'Suresh Parmar', role: 'DRIVER' },
    { email: 'driver3@transitops.com', name: 'Manoj Solanki', role: 'DRIVER' },
    { email: 'safety@transitops.com', name: 'Priya Trivedi', role: 'SAFETY_OFFICER' },
    { email: 'safety2@transitops.com', name: 'Ravi Chauhan', role: 'SAFETY_OFFICER' },
    { email: 'analyst@transitops.com', name: 'Rohan Joshi', role: 'FINANCIAL_ANALYST' },
    { email: 'analyst2@transitops.com', name: 'Neha Shah', role: 'FINANCIAL_ANALYST' },
    { email: 'admin@transitops.com', name: 'Sanjay Bhatt', role: 'FLEET_MANAGER' },
  ];

  const users = [];
  for (const u of usersData) {
    users.push(await prisma.user.create({
      data: { email: u.email, passwordHash, name: u.name, role: u.role },
    }));
  }
  console.log(`  ✔ Created ${users.length} users (password: Password123!)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. VEHICLES (25 — all Gujarat, region: West)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[3/8] Seeding Vehicles (Gujarat only)...');

  const vehicleSpecs = [
    // TRUCKS (10)
    { type: 'TRUCK', maxLoad: 25000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 16000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 22000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 35000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 18000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 28000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 11000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 40000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 20000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    { type: 'TRUCK', maxLoad: 15000, odomRange: [30000, 350000], costRange: [2800000, 12000000] },
    // VANS (6)
    { type: 'VAN', maxLoad: 1200, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    { type: 'VAN', maxLoad: 2000, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    { type: 'VAN', maxLoad: 800, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    { type: 'VAN', maxLoad: 1500, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    { type: 'VAN', maxLoad: 3000, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    { type: 'VAN', maxLoad: 750, odomRange: [10000, 200000], costRange: [400000, 1800000] },
    // BUSES (4)
    { type: 'BUS', maxLoad: 8000, odomRange: [50000, 400000], costRange: [5000000, 15000000] },
    { type: 'BUS', maxLoad: 6000, odomRange: [50000, 400000], costRange: [5000000, 15000000] },
    { type: 'BUS', maxLoad: 10000, odomRange: [50000, 400000], costRange: [5000000, 15000000] },
    { type: 'BUS', maxLoad: 4500, odomRange: [50000, 400000], costRange: [5000000, 15000000] },
    // CARS (3)
    { type: 'CAR', maxLoad: 500, odomRange: [5000, 120000], costRange: [800000, 2500000] },
    { type: 'CAR', maxLoad: 400, odomRange: [5000, 120000], costRange: [800000, 2500000] },
    { type: 'CAR', maxLoad: 700, odomRange: [5000, 120000], costRange: [800000, 2500000] },
    // MOTORCYCLES (2)
    { type: 'MOTORCYCLE', maxLoad: 50, odomRange: [2000, 60000], costRange: [80000, 250000] },
    { type: 'MOTORCYCLE', maxLoad: 30, odomRange: [2000, 60000], costRange: [80000, 250000] },
  ];

  const vehicleStatuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'ON_TRIP', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
  const usedRegNos = new Set();

  function generateRegNo() {
    let reg;
    do {
      const rto = pick(INDIA_RTOS);
      const letters = String.fromCharCode(65 + randInt(0, 25)) + String.fromCharCode(65 + randInt(0, 25));
      const num = String(randInt(1000, 9999));
      reg = `${rto}-${letters}-${num}`;
    } while (usedRegNos.has(reg));
    usedRegNos.add(reg);
    return reg;
  }

  const vehicles = [];
  const regions = ['North', 'South', 'West', 'East'];
  for (let i = 0; i < vehicleSpecs.length; i++) {
    const spec = vehicleSpecs[i];
    const city = pick(INDIA_CITIES);
    const status = pick(vehicleStatuses);

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo: generateRegNo(),
        name: pick(VEHICLE_NAMES[spec.type]),
        type: spec.type,
        maxLoadCapacity: spec.maxLoad,
        odometer: randInt(spec.odomRange[0], spec.odomRange[1]),
        acquisitionCost: randInt(spec.costRange[0], spec.costRange[1]),
        status,
        region: pick(regions),
        currentLat: status !== 'RETIRED' ? city.lat + randFloat(-0.02, 0.02) : null,
        currentLng: status !== 'RETIRED' ? city.lng + randFloat(-0.02, 0.02) : null,
      },
    });
    vehicles.push(vehicle);
  }

  const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED');
  console.log(`  ✔ Created ${vehicles.length} vehicles (${activeVehicles.length} active, all India)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. DRIVERS (20 — Gujarati names)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[4/8] Seeding Drivers...');

  const usedLicenses = new Set();
  const usedNames = new Set();

  function generateLicense() {
    let lic;
    do {
      const year = randInt(2012, 2023);
      const num = String(randInt(1000000, 9999999));
      lic = `GJ-${year}-${num}`;
    } while (usedLicenses.has(lic));
    usedLicenses.add(lic);
    return lic;
  }

  function generateDriverName() {
    let name;
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
  }

  const driverStatuses = [
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE',
    'ON_TRIP', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED',
  ];

  const drivers = [];
  for (let i = 0; i < 20; i++) {
    const isExpired = i === 18;
    const isSuspended = i === 19;
    const licExpiry = isExpired
      ? new Date('2023-06-15')
      : new Date(`${randInt(2027, 2031)}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`);

    const status = isSuspended ? 'SUSPENDED' : isExpired ? 'OFF_DUTY' : pick(driverStatuses);
    const safetyScore = isSuspended ? randFloat(30, 55) : isExpired ? randFloat(60, 75) : randFloat(72, 100);

    drivers.push(await prisma.driver.create({
      data: {
        name: generateDriverName(),
        licenseNumber: generateLicense(),
        licenseCategory: pick(LICENSE_CATEGORIES),
        licenseExpiry: licExpiry,
        contactNumber: `+91 ${randInt(70000, 99999)} ${randInt(10000, 99999)}`,
        safetyScore,
        status,
      },
    }));
  }

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');
  console.log(`  ✔ Created ${drivers.length} drivers (${availableDrivers.length} available)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TRIPS (120 — Gujarat-to-Gujarat routes over 6 months)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[5/8] Seeding Trips...');

  const tripStatusWeights = [
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
    'IN_PROGRESS', 'IN_PROGRESS',
    'DISPATCHED', 'DISPATCHED', 'DISPATCHED',
    'DRAFT', 'DRAFT',
    'CANCELLED',
  ];

  const tripsData = [];
  const now = Date.now();

  for (let i = 0; i < 120; i++) {
    let srcCity, destCity;
    do {
      srcCity = pick(INDIA_CITIES);
      destCity = pick(INDIA_CITIES);
    } while (srcCity.name === destCity.name);

    const vehicle = pick(activeVehicles);
    const driver = pick(drivers.filter(d => d.status !== 'SUSPENDED'));
    const status = pick(tripStatusWeights);
    const plannedDistance = randFloat(30, 650, 0);

    const cargoWeight = vehicle.type === 'MOTORCYCLE' ? randFloat(5, 40, 1)
      : vehicle.type === 'CAR' ? randFloat(50, 450, 0)
        : vehicle.type === 'VAN' ? randFloat(200, vehicle.maxLoadCapacity * 0.95, 0)
          : randFloat(2000, vehicle.maxLoadCapacity * 0.95, 0);

    let createdAt, dispatchedAt, completedAt, cancelledAt;
    const tripAge = randInt(0, 180);

    if (status === 'COMPLETED') {
      createdAt = daysAgo(tripAge + randInt(1, 3));
      dispatchedAt = daysAgo(tripAge + randInt(0, 1));
      completedAt = daysAgo(tripAge);
    } else if (status === 'IN_PROGRESS' || status === 'DISPATCHED') {
      createdAt = daysAgo(randInt(0, 3));
      dispatchedAt = daysAgo(randInt(0, 1));
    } else if (status === 'CANCELLED') {
      createdAt = daysAgo(tripAge + randInt(1, 5));
      cancelledAt = daysAgo(tripAge);
    } else {
      createdAt = daysAgo(randInt(0, 7));
    }

    const isDelayed = status === 'COMPLETED' ? Math.random() < 0.2 : false;
    const actualDistance = status === 'COMPLETED' ? plannedDistance + randFloat(-15, 40, 1) : null;
    const fuelConsumed = status === 'COMPLETED' ? randFloat(actualDistance * 0.04, actualDistance * 0.12, 1) : null;
    const revenue = (status === 'COMPLETED' || status === 'IN_PROGRESS') ? randFloat(5000, 250000, 0) : null;

    tripsData.push(await prisma.trip.create({
      data: {
        source: `${srcCity.name} ${pick(LOCATION_SUFFIXES)}`,
        destination: `${destCity.name} ${pick(LOCATION_SUFFIXES)}`,
        cargoWeight,
        plannedDistance,
        actualDistance,
        fuelConsumed,
        revenue,
        status,
        isDelayed,
        sourceLat: srcCity.lat + randFloat(-0.02, 0.02),
        sourceLng: srcCity.lng + randFloat(-0.02, 0.02),
        destLat: destCity.lat + randFloat(-0.02, 0.02),
        destLng: destCity.lng + randFloat(-0.02, 0.02),
        vehicleId: vehicle.id,
        driverId: driver.id,
        dispatchedAt: dispatchedAt || null,
        completedAt: completedAt || null,
        cancelledAt: cancelledAt || null,
        createdAt,
      },
    }));
  }

  const completedTrips = tripsData.filter(t => t.status === 'COMPLETED').length;
  const activeTrips = tripsData.filter(t => ['IN_PROGRESS', 'DISPATCHED'].includes(t.status)).length;
  console.log(`  ✔ Created ${tripsData.length} trips (${completedTrips} completed, ${activeTrips} active)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MAINTENANCE LOGS (60 over 6 months)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[6/8] Seeding Maintenance Logs...');

  const maintenanceStatusWeights = [
    'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED',
    'CLOSED', 'CLOSED', 'IN_PROGRESS', 'IN_PROGRESS', 'OPEN',
  ];

  let maintenanceCount = 0;
  for (let i = 0; i < 60; i++) {
    const vehicle = pick(vehicles);
    const status = pick(maintenanceStatusWeights);
    const daysBack = randInt(0, 180);
    const scheduledDate = daysAgo(daysBack);
    const completedDate = status === 'CLOSED' ? daysAgo(Math.max(0, daysBack - randInt(1, 5))) : null;

    const baseCost = vehicle.type === 'TRUCK' ? randInt(3000, 85000)
      : vehicle.type === 'BUS' ? randInt(5000, 120000)
        : vehicle.type === 'VAN' ? randInt(1500, 35000)
          : vehicle.type === 'CAR' ? randInt(1000, 25000)
            : randInt(500, 8000);

    await prisma.maintenanceLog.create({
      data: {
        description: pick(MAINTENANCE_DESCRIPTIONS),
        cost: baseCost,
        status,
        scheduledDate,
        completedDate,
        vehicleId: vehicle.id,
      },
    });
    maintenanceCount++;
  }
  console.log(`  ✔ Created ${maintenanceCount} maintenance logs\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. FUEL LOGS (200 — EVENLY spread across last 14 days + older)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[7/8] Seeding Fuel Logs...');

  let fuelCount = 0;

  // Ensure every day in the last 14 days has fuel logs
  for (let day = 0; day < 14; day++) {
    const logsPerDay = randInt(4, 8);
    for (let j = 0; j < logsPerDay; j++) {
      const vehicle = pick(activeVehicles);
      const driver = Math.random() > 0.15 ? pick(drivers.filter(d => d.status !== 'SUSPENDED')) : null;

      const liters = vehicle.type === 'TRUCK' ? randFloat(80, 300, 1)
        : vehicle.type === 'BUS' ? randFloat(60, 250, 1)
          : vehicle.type === 'VAN' ? randFloat(20, 80, 1)
            : vehicle.type === 'CAR' ? randFloat(15, 55, 1)
              : randFloat(3, 15, 1);

      const costPerLiter = vehicle.type === 'MOTORCYCLE' ? randFloat(96, 108, 2) : randFloat(87, 98, 2);
      const totalCost = parseFloat((liters * costPerLiter).toFixed(2));
      const odometerReading = Math.max(0, vehicle.odometer - randInt(0, 20000) + randInt(0, 5000));

      // Exact day with random hour
      const logDate = new Date(now - day * 24 * 3600 * 1000);
      logDate.setHours(randInt(6, 22), randInt(0, 59), 0, 0);

      await prisma.fuelLog.create({
        data: {
          liters,
          costPerLiter,
          totalCost,
          date: logDate,
          odometerReading,
          stationName: pick(FUEL_STATIONS),
          vehicleId: vehicle.id,
          driverId: driver ? driver.id : null,
        },
      });
      fuelCount++;
    }
  }

  // Older fuel logs (15-180 days ago)
  for (let i = 0; i < 120; i++) {
    const vehicle = pick(activeVehicles);
    const driver = Math.random() > 0.15 ? pick(drivers.filter(d => d.status !== 'SUSPENDED')) : null;
    const daysBack = randInt(15, 180);

    const liters = vehicle.type === 'TRUCK' ? randFloat(80, 300, 1)
      : vehicle.type === 'BUS' ? randFloat(60, 250, 1)
        : vehicle.type === 'VAN' ? randFloat(20, 80, 1)
          : vehicle.type === 'CAR' ? randFloat(15, 55, 1)
            : randFloat(3, 15, 1);

    const costPerLiter = vehicle.type === 'MOTORCYCLE' ? randFloat(96, 108, 2) : randFloat(87, 98, 2);
    const totalCost = parseFloat((liters * costPerLiter).toFixed(2));

    await prisma.fuelLog.create({
      data: {
        liters,
        costPerLiter,
        totalCost,
        date: daysAgo(daysBack),
        odometerReading: Math.max(0, vehicle.odometer - randInt(0, 30000)),
        stationName: pick(FUEL_STATIONS),
        vehicleId: vehicle.id,
        driverId: driver ? driver.id : null,
      },
    });
    fuelCount++;
  }

  console.log(`  ✔ Created ${fuelCount} fuel logs (every day in last 14 days covered)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. EXPENSES (200 — ALL 6 categories with [Cat: X] prefix, spread across 14 days + older)
  //    Categories: TOLL, MAINTENANCE, FUEL, SALARY, INSURANCE, OTHER
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[8/8] Seeding Expenses & Telemetry...');

  const frontendCategories = ['TOLL', 'MAINTENANCE', 'FUEL', 'SALARY', 'INSURANCE', 'OTHER'];
  let expenseCount = 0;

  // Ensure every day in the last 14 days has expenses from EVERY category
  for (let day = 0; day < 14; day++) {
    for (const cat of frontendCategories) {
      const template = EXPENSE_TEMPLATES[cat];
      const entriesPerCatPerDay = cat === 'INSURANCE' ? randInt(1, 2) : randInt(2, 5);

      for (let j = 0; j < entriesPerCatPerDay; j++) {
        const vehicle = pick(activeVehicles);
        const desc = pick(template.descriptions);
        const amount = randFloat(template.amountRange[0], template.amountRange[1], 0);

        const expDate = new Date(now - day * 24 * 3600 * 1000);
        expDate.setHours(randInt(6, 22), randInt(0, 59), 0, 0);

        // Use [Cat: CATEGORY] prefix so dashboard parses it correctly
        const dbDescription = `[Cat: ${cat}] ${desc}`;

        await prisma.expense.create({
          data: {
            category: template.dbCategory,
            description: dbDescription,
            amount,
            date: expDate,
            vehicleId: vehicle.id,
          },
        });
        expenseCount++;
      }
    }
  }

  // Older expenses (15-180 days ago)
  for (let i = 0; i < 100; i++) {
    const cat = pick(frontendCategories);
    const template = EXPENSE_TEMPLATES[cat];
    const vehicle = pick(activeVehicles);
    const daysBack = randInt(15, 180);
    const desc = pick(template.descriptions);
    const amount = randFloat(template.amountRange[0], template.amountRange[1], 0);
    const dbDescription = `[Cat: ${cat}] ${desc}`;

    await prisma.expense.create({
      data: {
        category: template.dbCategory,
        description: dbDescription,
        amount,
        date: daysAgo(daysBack),
        vehicleId: vehicle.id,
      },
    });
    expenseCount++;
  }

  console.log(`  ✔ Created ${expenseCount} expenses (all 6 categories: TOLL, MAINTENANCE, FUEL, SALARY, INSURANCE, OTHER)`);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. TELEMETRY LOGS (GPS points for on-trip and parked vehicles)
  // ──────────────────────────────────────────────────────────────────────────
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP');
  let telemetryCount = 0;

  for (const vehicle of onTripVehicles) {
    const matchingTrip = tripsData.find(
      t => t.vehicleId === vehicle.id && ['DISPATCHED', 'IN_PROGRESS'].includes(t.status)
    );

    const baseLat = matchingTrip ? matchingTrip.sourceLat : (vehicle.currentLat || 23.0225);
    const baseLng = matchingTrip ? matchingTrip.sourceLng : (vehicle.currentLng || 72.5714);
    const destLat = matchingTrip ? matchingTrip.destLat : baseLat + 0.3;
    const destLng = matchingTrip ? matchingTrip.destLng : baseLng + 0.3;

    const pointCount = randInt(15, 20);
    for (let j = 0; j < pointCount; j++) {
      const progress = j / pointCount;
      const lat = baseLat + (destLat - baseLat) * progress + randFloat(-0.005, 0.005);
      const lng = baseLng + (destLng - baseLng) * progress + randFloat(-0.005, 0.005);

      await prisma.telemetryLog.create({
        data: {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
          speed: randFloat(0, 85, 1),
          heading: randFloat(0, 360, 1),
          timestamp: new Date(now - (pointCount - j) * 30 * 60 * 1000),
          vehicleId: vehicle.id,
        },
      });
      telemetryCount++;
    }
  }

  // Parked vehicles
  const parkedVehicles = vehicles.filter(v => v.status === 'AVAILABLE').slice(0, 4);
  for (const vehicle of parkedVehicles) {
    for (let j = 0; j < 5; j++) {
      await prisma.telemetryLog.create({
        data: {
          latitude: (vehicle.currentLat || 23.0225) + randFloat(-0.001, 0.001),
          longitude: (vehicle.currentLng || 72.5714) + randFloat(-0.001, 0.001),
          speed: 0,
          heading: randFloat(0, 360, 1),
          timestamp: new Date(now - (5 - j) * 60 * 60 * 1000),
          vehicleId: vehicle.id,
        },
      });
      telemetryCount++;
    }
  }

  console.log(`  ✔ Created ${telemetryCount} telemetry GPS points\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  const totalRecords = users.length + vehicles.length + drivers.length
    + tripsData.length + maintenanceCount + fuelCount + expenseCount + telemetryCount;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   SEEDING COMPLETE                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Users             : ${String(users.length).padStart(5)}                               ║`);
  console.log(`║  Vehicles          : ${String(vehicles.length).padStart(5)}  (all Gujarat)              ║`);
  console.log(`║  Drivers           : ${String(drivers.length).padStart(5)}                               ║`);
  console.log(`║  Trips             : ${String(tripsData.length).padStart(5)}  (Gujarat routes)           ║`);
  console.log(`║  Maintenance Logs  : ${String(maintenanceCount).padStart(5)}                               ║`);
  console.log(`║  Fuel Logs         : ${String(fuelCount).padStart(5)}                               ║`);
  console.log(`║  Expenses          : ${String(expenseCount).padStart(5)}  (all 6 categories)         ║`);
  console.log(`║  Telemetry Points  : ${String(telemetryCount).padStart(5)}                               ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL RECORDS     : ${String(totalRecords).padStart(5)}                               ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n🔑 Login: Password123!  |  📍 All vehicles in Gujarat');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
