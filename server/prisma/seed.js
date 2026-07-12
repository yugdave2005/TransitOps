const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Random integer between min (inclusive) and max (inclusive) */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max, rounded to 'decimals' places */
function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a date in the past N days from a reference date */
function daysAgo(days, fromDate = new Date()) {
  return new Date(fromDate.getTime() - days * 24 * 3600 * 1000);
}

/** Generate a random date between two dates */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Realistic Data Pools ───────────────────────────────────────────────────────

const INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, region: 'North' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'West' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, region: 'South' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, region: 'South' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, region: 'East' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, region: 'South' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, region: 'West' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, region: 'West' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, region: 'North' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, region: 'North' },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, region: 'North' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, region: 'West' },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, region: 'South' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, region: 'West' },
  { name: 'Patna', lat: 25.6093, lng: 85.1376, region: 'East' },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, region: 'South' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, region: 'East' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, region: 'West' },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, region: 'East' },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, region: 'South' },
  { name: 'Mysore', lat: 12.2958, lng: 76.6394, region: 'South' },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, region: 'West' },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812, region: 'West' },
  { name: 'Dehradun', lat: 30.3165, lng: 78.0322, region: 'North' },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096, region: 'East' },
];

const LOCATION_SUFFIXES = [
  'Hub', 'Logistics Center', 'Port', 'Warehouse', 'Industrial Area',
  'Distribution Center', 'Depot', 'Terminal', 'Freight Yard', 'Storage Complex',
  'Container Yard', 'Loading Point', 'Transit Hub', 'Cargo Terminal',
];

const FUEL_STATIONS = [
  'Indian Oil Highway Station', 'Bharat Petroleum Depot', 'Hindustan Petroleum Center',
  'Reliance Fuel Stop', 'Shell Express', 'Essar Fuel Station', 'HP Petrol Pump',
  'IOCL Highway Point', 'BPCL Truck Fueling Center', 'Nayara Energy Hub',
  'Total Energies Service Station', 'GAIL Gas Station', 'Adani Gas Point',
  'City Fuel Station', 'Metro Fuels', 'Quick Fill Station', 'Highway Fuel Center',
  'National Fuel Stop', 'Express Petroleum', 'Greenway Fuel Station',
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

const EXPENSE_DESCRIPTIONS = {
  TOLL: [
    'NH-48 Fastag toll charges', 'Mumbai-Pune Expressway toll',
    'Yamuna Expressway toll', 'NH-44 tolls (Hyderabad-Bangalore)',
    'Bangalore-Mysore Expressway toll', 'Delhi-Jaipur NH-8 toll',
    'Agra-Lucknow Expressway toll', 'Kolkata-Durgapur Expressway toll',
    'Chennai-Salem NH toll', 'NH-66 coastal highway toll',
    'Ahmedabad-Vadodara Expressway toll', 'Eastern Peripheral Expressway toll',
  ],
  PARKING: [
    'Overnight parking at truck terminal', 'Warehouse parking fee',
    'City logistics zone parking', 'Port area parking charges',
    'Secured parking at highway rest stop', 'Airport cargo zone parking',
    'Industrial estate parking', 'Multi-level parking at distribution center',
  ],
  REPAIR: [
    'Emergency tyre puncture repair', 'Roadside windshield crack repair',
    'Hydraulic hose replacement (emergency)', 'Tail light assembly replacement',
    'Side mirror replacement after collision', 'Door lock mechanism repair',
    'Fuel line leak repair', 'Wiper motor replacement',
    'Horn and indicator relay replacement', 'Emergency fan belt replacement',
  ],
  INSURANCE: [
    'Annual comprehensive vehicle insurance premium',
    'Third-party liability insurance renewal',
    'Goods-in-transit insurance premium',
    'Motor vehicle accident damage claim deductible',
    'Fleet insurance bundle renewal (quarterly)',
    'Driver personal accident insurance',
  ],
  OTHER: [
    'Driver food and accommodation allowance', 'Vehicle cleaning and wash',
    'GPS tracking device maintenance', 'Fitness certificate renewal fee',
    'Pollution Under Control (PUC) certificate', 'Road tax renewal',
    'Permit fee for state border crossing', 'Weighbridge charges',
    'Loading/unloading labor charges', 'Documentation and challan fees',
    'Vehicle registration renewal', 'Driver uniform and safety gear',
  ],
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

const INDIAN_STATES_RTO = [
  'KA', 'DL', 'MH', 'TN', 'KL', 'AP', 'TS', 'GJ', 'RJ', 'UP',
  'WB', 'MP', 'HR', 'PB', 'BR', 'OR', 'AS', 'JH', 'UK', 'GA',
];

const FIRST_NAMES = [
  'Rajesh', 'Vikram', 'Suresh', 'Manoj', 'Priya', 'Anita', 'Kiran',
  'Deepak', 'Amit', 'Sandeep', 'Ramesh', 'Arjun', 'Ravi', 'Sanjay',
  'Pooja', 'Rohit', 'Naveen', 'Aakash', 'Gaurav', 'Neha', 'Harish',
  'Vijay', 'Lakshmi', 'Gopal', 'Sunil', 'Ajay', 'Dinesh', 'Mohan',
  'Pankaj', 'Yogesh',
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Verma', 'Singh', 'Patil', 'Gupta', 'Mehta',
  'Reddy', 'Nair', 'Tiwari', 'Mishra', 'Yadav', 'Joshi', 'Pillai',
  'Chauhan', 'Desai', 'Rao', 'Malhotra', 'Agarwal', 'Pandey',
  'Iyer', 'Kulkarni', 'Menon', 'Bhat', 'Das',
];

const LICENSE_CATEGORIES = [
  'CE (Heavy Trailer)', 'C (Heavy Rigid Truck)', 'D (Heavy Bus)',
  'LMV (Light Motor Vehicle)', 'MCWG (Motorcycle With Gear)',
];

// ─── Main Seed Function ─────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       TransitOps — Comprehensive Database Seeding          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  // Clean up existing data in reverse relation order
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

  // ────────────────────────────────────────────────────────────────────────────
  // 1. USERS (10 users across all 4 roles)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[2/8] Seeding Users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    { email: 'fleet_mgr@transitops.com', name: 'Vikram Mehta', role: 'FLEET_MANAGER' },
    { email: 'fleet_mgr2@transitops.com', name: 'Anita Desai', role: 'FLEET_MANAGER' },
    { email: 'driver1@transitops.com', name: 'Alex Kumar', role: 'DRIVER' },
    { email: 'driver2@transitops.com', name: 'Suresh Patil', role: 'DRIVER' },
    { email: 'driver3@transitops.com', name: 'Manoj Tiwari', role: 'DRIVER' },
    { email: 'safety@transitops.com', name: 'Priya Sharma', role: 'SAFETY_OFFICER' },
    { email: 'safety2@transitops.com', name: 'Ravi Chauhan', role: 'SAFETY_OFFICER' },
    { email: 'analyst@transitops.com', name: 'Rohan Gupta', role: 'FINANCIAL_ANALYST' },
    { email: 'analyst2@transitops.com', name: 'Neha Agarwal', role: 'FINANCIAL_ANALYST' },
    { email: 'admin@transitops.com', name: 'Sanjay Malhotra', role: 'FLEET_MANAGER' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: { email: u.email, passwordHash, name: u.name, role: u.role },
    });
    users.push(user);
  }
  console.log(`  ✔ Created ${users.length} users (password for all: Password123!)\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 2. VEHICLES (25 vehicles — mix of types, statuses, regions)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[3/8] Seeding Vehicles...');

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
      const state = pick(INDIAN_STATES_RTO);
      const district = String(randInt(1, 50)).padStart(2, '0');
      const letters = String.fromCharCode(65 + randInt(0, 25)) + String.fromCharCode(65 + randInt(0, 25));
      const num = String(randInt(1000, 9999));
      reg = `${state}-${district}-${letters}-${num}`;
    } while (usedRegNos.has(reg));
    usedRegNos.add(reg);
    return reg;
  }

  const vehicles = [];
  for (let i = 0; i < vehicleSpecs.length; i++) {
    const spec = vehicleSpecs[i];
    const city = pick(INDIAN_CITIES);
    const status = pick(vehicleStatuses);
    const namePool = VEHICLE_NAMES[spec.type];
    const vName = pick(namePool);

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo: generateRegNo(),
        name: vName,
        type: spec.type,
        maxLoadCapacity: spec.maxLoad,
        odometer: randInt(spec.odomRange[0], spec.odomRange[1]),
        acquisitionCost: randInt(spec.costRange[0], spec.costRange[1]),
        status,
        region: city.region,
        currentLat: status !== 'RETIRED' ? city.lat + randFloat(-0.05, 0.05) : null,
        currentLng: status !== 'RETIRED' ? city.lng + randFloat(-0.05, 0.05) : null,
      },
    });
    vehicles.push(vehicle);
  }

  const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED');
  console.log(`  ✔ Created ${vehicles.length} vehicles (${activeVehicles.length} active, ${vehicles.length - activeVehicles.length} retired)\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 3. DRIVERS (20 drivers — varied statuses, license types, safety scores)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[4/8] Seeding Drivers...');

  const usedLicenses = new Set();
  const usedNames = new Set();

  function generateLicense() {
    let lic;
    do {
      const state = pick(INDIAN_STATES_RTO);
      const year = randInt(2010, 2022);
      const num = String(randInt(1000000, 9999999));
      lic = `${state}-${year}-${num}`;
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
    const isExpiredLicense = i === 18; // One driver with expired license
    const isSuspended = i === 19;     // One driver suspended
    const licExpiry = isExpiredLicense
      ? new Date('2023-06-15')
      : new Date(`${randInt(2027, 2031)}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`);

    const status = isSuspended ? 'SUSPENDED' : isExpiredLicense ? 'OFF_DUTY' : pick(driverStatuses);
    const safetyScore = isSuspended
      ? randFloat(30, 55)
      : isExpiredLicense
        ? randFloat(60, 75)
        : randFloat(72, 100);

    const driver = await prisma.driver.create({
      data: {
        name: generateDriverName(),
        licenseNumber: generateLicense(),
        licenseCategory: pick(LICENSE_CATEGORIES),
        licenseExpiry: licExpiry,
        contactNumber: `+91 ${randInt(70000, 99999)} ${randInt(10000, 99999)}`,
        safetyScore,
        status,
      },
    });
    drivers.push(driver);
  }

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');
  console.log(`  ✔ Created ${drivers.length} drivers (${availableDrivers.length} available, 1 expired license, 1 suspended)\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 4. TRIPS (120 trips over 6 months — realistic Indian routes)
  // ────────────────────────────────────────────────────────────────────────────
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
    // Pick two different cities
    let srcCity, destCity;
    do {
      srcCity = pick(INDIAN_CITIES);
      destCity = pick(INDIAN_CITIES);
    } while (srcCity.name === destCity.name);

    const vehicle = pick(activeVehicles);
    const driver = pick(drivers.filter(d => d.status !== 'SUSPENDED'));

    const status = pick(tripStatusWeights);
    const plannedDistance = randFloat(50, 2200, 0);
    const cargoWeight = vehicle.type === 'MOTORCYCLE'
      ? randFloat(5, 40, 1)
      : vehicle.type === 'CAR'
        ? randFloat(50, 450, 0)
        : vehicle.type === 'VAN'
          ? randFloat(200, vehicle.maxLoadCapacity * 0.95, 0)
          : randFloat(2000, vehicle.maxLoadCapacity * 0.95, 0);

    // Time ranges based on status
    let createdAt, dispatchedAt, completedAt, cancelledAt;
    const tripAge = randInt(0, 180); // up to 6 months ago

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
      // DRAFT
      createdAt = daysAgo(randInt(0, 7));
    }

    const isDelayed = status === 'COMPLETED' ? Math.random() < 0.2 : false;
    const actualDistance = status === 'COMPLETED' ? plannedDistance + randFloat(-15, 40, 1) : null;
    const fuelConsumed = status === 'COMPLETED' ? randFloat(actualDistance * 0.04, actualDistance * 0.12, 1) : null;
    const revenue = (status === 'COMPLETED' || status === 'IN_PROGRESS')
      ? randFloat(5000, 250000, 0)
      : null;

    const srcSuffix = pick(LOCATION_SUFFIXES);
    const destSuffix = pick(LOCATION_SUFFIXES);

    const trip = await prisma.trip.create({
      data: {
        source: `${srcCity.name} ${srcSuffix}`,
        destination: `${destCity.name} ${destSuffix}`,
        cargoWeight,
        plannedDistance,
        actualDistance,
        fuelConsumed,
        revenue,
        status,
        isDelayed,
        sourceLat: srcCity.lat + randFloat(-0.03, 0.03),
        sourceLng: srcCity.lng + randFloat(-0.03, 0.03),
        destLat: destCity.lat + randFloat(-0.03, 0.03),
        destLng: destCity.lng + randFloat(-0.03, 0.03),
        vehicleId: vehicle.id,
        driverId: driver.id,
        dispatchedAt: dispatchedAt || null,
        completedAt: completedAt || null,
        cancelledAt: cancelledAt || null,
        createdAt,
      },
    });
    tripsData.push(trip);
  }

  const completedTrips = tripsData.filter(t => t.status === 'COMPLETED').length;
  const activeTrips = tripsData.filter(t => ['IN_PROGRESS', 'DISPATCHED'].includes(t.status)).length;
  console.log(`  ✔ Created ${tripsData.length} trips (${completedTrips} completed, ${activeTrips} active, rest draft/cancelled)\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 5. MAINTENANCE LOGS (60 logs over 6 months)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[6/8] Seeding Maintenance Logs...');

  const maintenanceStatusWeights = [
    'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED',
    'CLOSED', 'CLOSED', 'IN_PROGRESS', 'IN_PROGRESS', 'OPEN',
  ];

  const maintenanceLogs = [];
  for (let i = 0; i < 60; i++) {
    const vehicle = pick(vehicles);
    const status = pick(maintenanceStatusWeights);
    const daysBack = randInt(0, 180);
    const scheduledDate = daysAgo(daysBack);
    const completedDate = status === 'CLOSED' ? daysAgo(daysBack - randInt(1, 5)) : null;

    // Cost varies by vehicle type and repair type
    const baseCost = vehicle.type === 'TRUCK' ? randInt(3000, 85000)
      : vehicle.type === 'BUS' ? randInt(5000, 120000)
        : vehicle.type === 'VAN' ? randInt(1500, 35000)
          : vehicle.type === 'CAR' ? randInt(1000, 25000)
            : randInt(500, 8000);

    const log = await prisma.maintenanceLog.create({
      data: {
        description: pick(MAINTENANCE_DESCRIPTIONS),
        cost: baseCost,
        status,
        scheduledDate,
        completedDate,
        vehicleId: vehicle.id,
      },
    });
    maintenanceLogs.push(log);
  }

  console.log(`  ✔ Created ${maintenanceLogs.length} maintenance logs\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 6. FUEL LOGS (200 logs over 6 months)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[7/8] Seeding Fuel Logs...');

  const fuelLogs = [];
  for (let i = 0; i < 200; i++) {
    const vehicle = pick(activeVehicles);
    const driver = Math.random() > 0.15 ? pick(drivers.filter(d => d.status !== 'SUSPENDED')) : null;
    const daysBack = randInt(0, 180);

    // Fuel quantity based on vehicle type
    const liters = vehicle.type === 'TRUCK' ? randFloat(80, 300, 1)
      : vehicle.type === 'BUS' ? randFloat(60, 250, 1)
        : vehicle.type === 'VAN' ? randFloat(20, 80, 1)
          : vehicle.type === 'CAR' ? randFloat(15, 55, 1)
            : randFloat(3, 15, 1);

    // Indian diesel/petrol prices (realistic range)
    const costPerLiter = vehicle.type === 'MOTORCYCLE'
      ? randFloat(96, 108, 2)  // Petrol
      : randFloat(87, 98, 2);   // Diesel

    const totalCost = parseFloat((liters * costPerLiter).toFixed(2));
    const odometerReading = vehicle.odometer - randInt(0, 20000) + randInt(0, 5000);

    const log = await prisma.fuelLog.create({
      data: {
        liters,
        costPerLiter,
        totalCost,
        date: daysAgo(daysBack),
        odometerReading: Math.max(0, odometerReading),
        stationName: pick(FUEL_STATIONS),
        vehicleId: vehicle.id,
        driverId: driver ? driver.id : null,
      },
    });
    fuelLogs.push(log);
  }

  console.log(`  ✔ Created ${fuelLogs.length} fuel logs\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // 7. EXPENSES (150 expenses — all categories over 6 months)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('[8/8] Seeding Expenses & Telemetry...');

  const expenseCategories = ['TOLL', 'TOLL', 'TOLL', 'PARKING', 'REPAIR', 'INSURANCE', 'OTHER', 'OTHER'];
  const expenses = [];
  for (let i = 0; i < 150; i++) {
    const vehicle = pick(activeVehicles);
    const category = pick(expenseCategories);
    const daysBack = randInt(0, 180);

    // Expense amounts based on category
    const amount = category === 'TOLL' ? randFloat(150, 4500, 0)
      : category === 'PARKING' ? randFloat(100, 2000, 0)
        : category === 'REPAIR' ? randFloat(500, 35000, 0)
          : category === 'INSURANCE' ? randFloat(15000, 85000, 0)
            : randFloat(200, 12000, 0);

    const descPool = EXPENSE_DESCRIPTIONS[category];
    const description = pick(descPool);

    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amount,
        date: daysAgo(daysBack),
        vehicleId: vehicle.id,
      },
    });
    expenses.push(expense);
  }

  console.log(`  ✔ Created ${expenses.length} expenses`);

  // ────────────────────────────────────────────────────────────────────────────
  // 8. TELEMETRY LOGS (100 GPS points — multiple vehicles last 24 hours)
  // ────────────────────────────────────────────────────────────────────────────
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP');
  const telemetryLogs = [];

  for (const vehicle of onTripVehicles) {
    // Find a trip associated with this vehicle that is active
    const matchingTrip = tripsData.find(
      t => t.vehicleId === vehicle.id && ['DISPATCHED', 'IN_PROGRESS'].includes(t.status)
    );

    const baseLat = matchingTrip ? matchingTrip.sourceLat : (vehicle.currentLat || 28.6139);
    const baseLng = matchingTrip ? matchingTrip.sourceLng : (vehicle.currentLng || 77.2090);
    const destLat = matchingTrip ? matchingTrip.destLat : baseLat + 0.5;
    const destLng = matchingTrip ? matchingTrip.destLng : baseLng + 0.5;

    // Generate 15-20 telemetry points per vehicle over last 8 hours
    const pointCount = randInt(15, 20);
    for (let j = 0; j < pointCount; j++) {
      const progress = j / pointCount;
      const lat = baseLat + (destLat - baseLat) * progress + randFloat(-0.01, 0.01);
      const lng = baseLng + (destLng - baseLng) * progress + randFloat(-0.01, 0.01);

      const log = await prisma.telemetryLog.create({
        data: {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
          speed: randFloat(0, 85, 1),
          heading: randFloat(0, 360, 1),
          timestamp: new Date(now - (pointCount - j) * 30 * 60 * 1000), // every 30 mins
          vehicleId: vehicle.id,
        },
      });
      telemetryLogs.push(log);
    }
  }

  // Also add some telemetry for a few AVAILABLE vehicles (parked — zero speed)
  const parkedVehicles = vehicles.filter(v => v.status === 'AVAILABLE').slice(0, 3);
  for (const vehicle of parkedVehicles) {
    for (let j = 0; j < 5; j++) {
      const log = await prisma.telemetryLog.create({
        data: {
          latitude: (vehicle.currentLat || 12.9716) + randFloat(-0.001, 0.001),
          longitude: (vehicle.currentLng || 77.5946) + randFloat(-0.001, 0.001),
          speed: 0,
          heading: randFloat(0, 360, 1),
          timestamp: new Date(now - (5 - j) * 60 * 60 * 1000),
          vehicleId: vehicle.id,
        },
      });
      telemetryLogs.push(log);
    }
  }

  console.log(`  ✔ Created ${telemetryLogs.length} telemetry GPS points\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────────
  const totalRecords = users.length + vehicles.length + drivers.length
    + tripsData.length + maintenanceLogs.length + fuelLogs.length
    + expenses.length + telemetryLogs.length;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   SEEDING COMPLETE                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Users             : ${String(users.length).padStart(5)}                               ║`);
  console.log(`║  Vehicles          : ${String(vehicles.length).padStart(5)}                               ║`);
  console.log(`║  Drivers           : ${String(drivers.length).padStart(5)}                               ║`);
  console.log(`║  Trips             : ${String(tripsData.length).padStart(5)}                               ║`);
  console.log(`║  Maintenance Logs  : ${String(maintenanceLogs.length).padStart(5)}                               ║`);
  console.log(`║  Fuel Logs         : ${String(fuelLogs.length).padStart(5)}                               ║`);
  console.log(`║  Expenses          : ${String(expenses.length).padStart(5)}                               ║`);
  console.log(`║  Telemetry Points  : ${String(telemetryLogs.length).padStart(5)}                               ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL RECORDS     : ${String(totalRecords).padStart(5)}                               ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n🔑 Login credentials for all users: Password123!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
