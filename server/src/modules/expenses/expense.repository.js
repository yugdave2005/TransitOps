const prisma = require('../../config/prisma');

function mapCategoryFrontendToDb(category) {
  if (category === 'TOLL') return 'TOLL';
  if (category === 'MAINTENANCE') return 'REPAIR';
  if (category === 'INSURANCE') return 'INSURANCE';
  return 'OTHER'; // Map FUEL, SALARY, OTHER to OTHER
}

async function findAll(filters = {}) {
  const where = {};
  if (filters.category) {
    // We filter by original category after parsing, but let's apply database filter if applicable
    const dbCat = mapCategoryFrontendToDb(filters.category);
    if (dbCat !== 'OTHER') {
      where.category = dbCat;
    }
  }
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      vehicle: { select: { id: true, registrationNo: true, type: true } }
    },
    orderBy: { date: 'desc' }
  });

  // Extract embedded category and trip IDs from descriptions
  const tripIds = [];
  const parsedExpenses = expenses.map(exp => {
    let description = exp.description || '';
    let category = exp.category; // fallback
    let tripId = null;

    // Parse category e.g. [Cat: SALARY]
    const catMatch = description.match(/^\[Cat:\s*([A-Z_]+)\]\s*/);
    if (catMatch) {
      category = catMatch[1];
      description = description.replace(catMatch[0], '');
    }

    // Parse tripId e.g. [Trip: UUID]
    const tripMatch = description.match(/^\[Trip:\s*([a-fA-F0-9-]+)\]\s*/);
    if (tripMatch) {
      tripId = tripMatch[1];
      description = description.replace(tripMatch[0], '');
      tripIds.push(tripId);
    }

    return {
      ...exp,
      category,
      tripId,
      description
    };
  });

  // Fetch linked trips if any
  let tripsMap = {};
  if (tripIds.length > 0) {
    const trips = await prisma.trip.findMany({
      where: { id: { in: tripIds } }
    });
    trips.forEach(t => {
      const dateStr = t.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      const code = `TRP-${dateStr}-${t.id.slice(0, 4).toUpperCase()}`;
      tripsMap[t.id] = {
        id: t.id,
        tripCode: code,
        origin: t.source,
        destination: t.destination
      };
    });
  }

  // Attach virtual trip objects and apply category filter if filtering by 'OTHER' / 'FUEL' / 'SALARY'
  let results = parsedExpenses.map(exp => {
    const trip = exp.tripId ? tripsMap[exp.tripId] : null;
    return {
      ...exp,
      trip
    };
  });

  if (filters.category) {
    results = results.filter(exp => exp.category === filters.category);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(exp => 
      (exp.description && exp.description.toLowerCase().includes(term)) ||
      (exp.vehicle && exp.vehicle.registrationNo.toLowerCase().includes(term))
    );
  }

  return results;
}

async function create(data) {
  const tripId = data.tripId;
  const rawDescription = data.description || '';
  const originalCategory = data.category;

  // Embed original category and tripId in the description
  let dbDescription = `[Cat: ${originalCategory}]`;
  if (tripId) {
    dbDescription += `[Trip: ${tripId}]`;
  }
  dbDescription += ` ${rawDescription}`;

  // Map category to a valid db enum value
  const dbCategory = mapCategoryFrontendToDb(originalCategory);

  const dbData = {
    category: dbCategory,
    amount: data.amount,
    date: data.date,
    description: dbDescription,
    vehicleId: data.vehicleId
  };

  const exp = await prisma.expense.create({
    data: dbData,
    include: {
      vehicle: true
    }
  });

  let trip = null;
  if (tripId) {
    const t = await prisma.trip.findUnique({ where: { id: tripId } });
    if (t) {
      const dateStr = t.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      const code = `TRP-${dateStr}-${t.id.slice(0, 4).toUpperCase()}`;
      trip = {
        id: t.id,
        tripCode: code,
        origin: t.source,
        destination: t.destination
      };
    }
  }

  return {
    ...exp,
    category: originalCategory,
    description: rawDescription,
    trip
  };
}

async function getMetrics() {
  // Use findAll to fetch mapped records
  const expenses = await findAll();
  
  let totalAmount = 0;
  const categoryTotals = {
    TOLL: 0,
    MAINTENANCE: 0,
    FUEL: 0,
    SALARY: 0,
    INSURANCE: 0,
    OTHER: 0
  };

  expenses.forEach(e => {
    totalAmount += e.amount;
    const cat = e.category;
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += e.amount;
    } else {
      categoryTotals.OTHER += e.amount;
    }
  });

  return {
    totalExpenses: expenses.length,
    totalAmount,
    categoryTotals
  };
}

module.exports = {
  findAll,
  create,
  getMetrics
};
