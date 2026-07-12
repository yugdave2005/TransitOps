# TransitOps — Smart Transport Operations Platform (v2)

## Implementation Plan — Production-Grade Distributed Architecture

A centralized fleet/transport operations ERP that digitizes vehicle, driver, dispatch, maintenance, and expense management — now upgraded with **domain-driven modular architecture**, **RabbitMQ async event processing**, **real-time WebSocket updates**, and **OpenStreetMap live fleet tracking**.

> [!IMPORTANT]
> **Fully Offline**: Zero external API keys or paid service dependencies. All fonts, icons, and libraries bundled via npm. PostgreSQL + RabbitMQ run in Docker. The only network request is **OSM tile loading** for the map view (free, no API key, public CDN tiles from `tile.openstreetmap.org`). All application logic, auth, and data processing is 100% local.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND (Vite)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Dashboard │  │  CRUD    │  │  Reports  │  │  Live Fleet Map   │  │
│  │   KPIs   │  │  Pages   │  │  Charts   │  │  (React-Leaflet)  │  │
│  └─────┬────┘  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│        │             │              │                  │             │
│        └─────────────┼──────────────┼──────────────────┘             │
│                      │         Socket.io Client                     │
│                 REST API          │  (real-time events)              │
├──────────────────────┼────────────┼─────────────────────────────────┤
│                      │            │                                  │
│              EXPRESS SERVER + SOCKET.IO SERVER                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              DOMAIN MODULES (Layered Architecture)          │    │
│  │  ┌──────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌────┐ │    │
│  │  │ Auth │ │Vehicles│ │Drivers│ │Trips │ │Maint.  │ │Track│ │    │
│  │  │      │ │        │ │       │ │      │ │        │ │-ing │ │    │
│  │  │route │ │route   │ │route  │ │route │ │route   │ │route│ │    │
│  │  │ctrl  │ │ctrl    │ │ctrl   │ │ctrl  │ │ctrl    │ │ctrl │ │    │
│  │  │svc   │ │svc     │ │svc    │ │svc   │ │svc     │ │svc  │ │    │
│  │  │repo  │ │repo    │ │repo   │ │repo  │ │repo    │ │repo │ │    │
│  │  │      │ │producer│ │       │ │prod. │ │prod.   │ │cons.│ │    │
│  │  └──────┘ └────────┘ └───────┘ └──────┘ └────────┘ └────┘ │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                            │                                        │
│                    ┌───────▼───────┐                                │
│                    │   RabbitMQ    │                                 │
│                    │  Event Bus   │                                  │
│                    │              │                                  │
│                    │ Exchanges:   │                                  │
│                    │ transitops.  │                                  │
│                    │   events     │                                  │
│                    └───────┬──────┘                                  │
│                            │                                        │
│              ┌─────────────┼─────────────┐                          │
│              ▼             ▼             ▼                           │
│     ┌──────────────┐ ┌──────────┐ ┌──────────────┐                 │
│     │ Analytics    │ │ Status   │ │ Telemetry    │                  │
│     │ Worker       │ │ Worker   │ │ Simulator    │                  │
│     │ (fuel eff,   │ │ (lock/   │ │ (GPS coord   │                  │
│     │  ROI calc)   │ │  unlock) │ │  generation) │                  │
│     └──────────────┘ └──────────┘ └──────────────┘                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│     ┌──────────────┐              ┌──────────────────────┐          │
│     │ PostgreSQL   │              │     RabbitMQ          │         │
│     │ (Prisma ORM) │              │  (Message Broker)     │         │
│     │ Port: 5432   │              │  Port: 5672 / 15672   │         │
│     └──────────────┘              └──────────────────────┘          │
│                    DOCKER COMPOSE                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Structure — Domain-Driven Modules

```
d:\TransitOps\
├── README.md
├── .gitignore
├── docker-compose.yml                # PostgreSQL + RabbitMQ containers
├── .env                              # DATABASE_URL, JWT_SECRET, RABBITMQ_URL, PORT
│
├── server/                           # Express + Prisma + Socket.io + RabbitMQ
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma             # Full DB schema (9 models + enums)
│   │   ├── migrations/
│   │   └── seed.js                   # Realistic sample data
│   └── src/
│       ├── index.js                  # Express + Socket.io + RabbitMQ bootstrap
│       │
│       ├── config/
│       │   ├── env.js                # Env var loader + validation
│       │   ├── prisma.js             # Prisma client singleton
│       │   ├── rabbitmq.js           # RabbitMQ connection + channel manager
│       │   └── socket.js             # Socket.io server setup + event registry
│       │
│       ├── middleware/
│       │   ├── auth.js               # JWT verification
│       │   ├── rbac.js               # Role-based access guard
│       │   ├── validate.js           # Zod request validation
│       │   └── errorHandler.js       # Global error handler
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── auth.route.js
│       │   │   ├── auth.controller.js
│       │   │   ├── auth.service.js
│       │   │   ├── auth.repository.js
│       │   │   └── auth.validator.js
│       │   │
│       │   ├── vehicles/
│       │   │   ├── vehicle.route.js
│       │   │   ├── vehicle.controller.js
│       │   │   ├── vehicle.service.js
│       │   │   ├── vehicle.repository.js
│       │   │   ├── vehicle.validator.js
│       │   │   └── vehicle.producer.js    # Publishes vehicle events
│       │   │
│       │   ├── drivers/
│       │   │   ├── driver.route.js
│       │   │   ├── driver.controller.js
│       │   │   ├── driver.service.js
│       │   │   ├── driver.repository.js
│       │   │   └── driver.validator.js
│       │   │
│       │   ├── trips/
│       │   │   ├── trip.route.js
│       │   │   ├── trip.controller.js
│       │   │   ├── trip.service.js
│       │   │   ├── trip.repository.js
│       │   │   ├── trip.validator.js
│       │   │   └── trip.producer.js       # Publishes trip.dispatched, trip.completed
│       │   │
│       │   ├── maintenance/
│       │   │   ├── maintenance.route.js
│       │   │   ├── maintenance.controller.js
│       │   │   ├── maintenance.service.js
│       │   │   ├── maintenance.repository.js
│       │   │   ├── maintenance.validator.js
│       │   │   └── maintenance.producer.js # Publishes maintenance.created
│       │   │
│       │   ├── fuel/
│       │   │   ├── fuel.route.js
│       │   │   ├── fuel.controller.js
│       │   │   ├── fuel.service.js
│       │   │   ├── fuel.repository.js
│       │   │   └── fuel.validator.js
│       │   │
│       │   ├── expenses/
│       │   │   ├── expense.route.js
│       │   │   ├── expense.controller.js
│       │   │   ├── expense.service.js
│       │   │   ├── expense.repository.js
│       │   │   └── expense.validator.js
│       │   │
│       │   ├── tracking/
│       │   │   ├── tracking.route.js       # REST endpoints for telemetry history
│       │   │   ├── tracking.controller.js
│       │   │   ├── tracking.service.js
│       │   │   ├── tracking.repository.js
│       │   │   ├── tracking.consumer.js    # Listens to vehicle.telemetry_updated
│       │   │   └── tracking.simulator.js   # GPS coordinate simulation engine
│       │   │
│       │   ├── dashboard/
│       │   │   ├── dashboard.route.js
│       │   │   ├── dashboard.controller.js
│       │   │   └── dashboard.service.js
│       │   │
│       │   └── reports/
│       │       ├── report.route.js
│       │       ├── report.controller.js
│       │       ├── report.service.js
│       │       └── report.csv.js           # CSV generation utility
│       │
│       ├── workers/                        # Background event consumers
│       │   ├── status.worker.js            # Handles status lock/unlock transitions
│       │   ├── analytics.worker.js         # Fuel efficiency, ROI recalculation
│       │   ├── telemetry.worker.js         # Processes GPS updates → Socket.io broadcast
│       │   └── notification.worker.js      # Fleet manager alerts (in-app)
│       │
│       ├── events/
│       │   ├── eventTypes.js               # Event name constants
│       │   ├── publisher.js                # Generic RabbitMQ publish helper
│       │   └── subscriber.js               # Generic RabbitMQ consume helper
│       │
│       └── utils/
│           ├── jwt.js
│           ├── password.js
│           └── geoUtils.js                 # Coordinate interpolation, distance calc
│
├── client/                                 # React (Vite) + Tailwind + Socket.io client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   └── fonts/                          # Locally bundled Inter WOFF2 files
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                       # Tailwind + @font-face + Odoo overrides
│       │
│       ├── api/
│       │   ├── client.js                   # Axios instance + auth interceptors
│       │   ├── auth.api.js
│       │   ├── vehicles.api.js
│       │   ├── drivers.api.js
│       │   ├── trips.api.js
│       │   ├── maintenance.api.js
│       │   ├── fuel.api.js
│       │   ├── expenses.api.js
│       │   ├── tracking.api.js
│       │   └── reports.api.js
│       │
│       ├── context/
│       │   ├── AuthContext.jsx             # JWT + user state
│       │   └── SocketContext.jsx           # Socket.io connection + event listeners
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useFetch.js
│       │   ├── useSocket.js               # Subscribe to real-time events
│       │   └── useRealTimeKpi.js           # Live-updating dashboard KPIs
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.jsx
│       │   │   ├── TopBar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Breadcrumb.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── DataTable.jsx
│       │   │   ├── StatusBadge.jsx
│       │   │   ├── KpiCard.jsx
│       │   │   ├── ViewToggle.jsx
│       │   │   ├── EmptyState.jsx
│       │   │   ├── ConfirmDialog.jsx
│       │   │   ├── LoadingSpinner.jsx
│       │   │   └── Toast.jsx              # Real-time notification toasts
│       │   ├── charts/
│       │   │   ├── BarChart.jsx
│       │   │   ├── PieChart.jsx
│       │   │   └── LineChart.jsx
│       │   └── map/
│       │       ├── FleetMap.jsx            # Main OSM map component
│       │       ├── VehicleMarker.jsx       # Custom truck marker with animation
│       │       ├── VehiclePopup.jsx        # Click popup with summary
│       │       └── VehicleDetailDrawer.jsx # Rich side panel with full details
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx
│       │   │   └── SignupPage.jsx
│       │   ├── DashboardPage.jsx           # KPI cards + mini fleet map
│       │   ├── LiveTrackingPage.jsx         # Full-screen fleet map
│       │   ├── vehicles/
│       │   │   ├── VehicleListPage.jsx
│       │   │   └── VehicleFormPage.jsx
│       │   ├── drivers/
│       │   │   ├── DriverListPage.jsx
│       │   │   └── DriverFormPage.jsx
│       │   ├── trips/
│       │   │   ├── TripListPage.jsx
│       │   │   └── TripFormPage.jsx
│       │   ├── maintenance/
│       │   │   ├── MaintenanceListPage.jsx
│       │   │   └── MaintenanceFormPage.jsx
│       │   ├── fuel/
│       │   │   └── FuelLogPage.jsx
│       │   ├── expenses/
│       │   │   └── ExpenseLogPage.jsx
│       │   └── reports/
│       │       └── ReportsPage.jsx
│       │
│       └── utils/
│           ├── constants.js
│           └── formatters.js
```

---

## 3. Database Schema (Prisma)

### 3.1 Enums

```prisma
enum Role {
  FLEET_MANAGER
  DRIVER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum VehicleType {
  TRUCK
  VAN
  BUS
  CAR
  MOTORCYCLE
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum MaintenanceStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum ExpenseCategory {
  TOLL
  PARKING
  REPAIR
  INSURANCE
  OTHER
}
```

### 3.2 Models (9 Tables)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(DRIVER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Vehicle {
  id               String        @id @default(uuid())
  registrationNo   String        @unique
  name             String
  type             VehicleType
  maxLoadCapacity  Float
  odometer         Float         @default(0)
  acquisitionCost  Float         @default(0)
  status           VehicleStatus @default(AVAILABLE)
  region           String?

  // Current GPS position (updated by telemetry)
  currentLat       Float?
  currentLng       Float?

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  trips            Trip[]
  maintenanceLogs  MaintenanceLog[]
  fuelLogs         FuelLog[]
  expenses         Expense[]
  telemetryLogs    TelemetryLog[]
}

model Driver {
  id              String       @id @default(uuid())
  name            String
  licenseNumber   String       @unique
  licenseCategory String
  licenseExpiry   DateTime
  contactNumber   String
  safetyScore     Float        @default(100)
  status          DriverStatus @default(AVAILABLE)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  trips           Trip[]
}

model Trip {
  id              String     @id @default(uuid())
  source          String
  destination     String
  cargoWeight     Float
  plannedDistance  Float
  actualDistance   Float?
  fuelConsumed    Float?
  revenue         Float?     @default(0)
  status          TripStatus @default(DRAFT)

  // GPS coordinates for route simulation
  sourceLat       Float?
  sourceLng       Float?
  destLat         Float?
  destLng         Float?

  vehicleId       String
  vehicle         Vehicle    @relation(fields: [vehicleId], references: [id])

  driverId        String
  driver          Driver     @relation(fields: [driverId], references: [id])

  dispatchedAt    DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

model MaintenanceLog {
  id              String            @id @default(uuid())
  description     String
  cost            Float             @default(0)
  status          MaintenanceStatus @default(OPEN)
  scheduledDate   DateTime?
  completedDate   DateTime?

  vehicleId       String
  vehicle         Vehicle           @relation(fields: [vehicleId], references: [id])

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model FuelLog {
  id          String   @id @default(uuid())
  liters      Float
  cost        Float
  date        DateTime
  odometer    Float?

  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Expense {
  id          String          @id @default(uuid())
  category    ExpenseCategory
  description String?
  amount      Float
  date        DateTime

  vehicleId   String
  vehicle     Vehicle         @relation(fields: [vehicleId], references: [id])

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

// NEW: GPS telemetry log for live tracking
model TelemetryLog {
  id          String   @id @default(uuid())
  latitude    Float
  longitude   Float
  speed       Float?                // km/h
  heading     Float?                // degrees (0-360)
  timestamp   DateTime @default(now())

  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId, timestamp])   // Fast queries for recent telemetry
}
```

### 3.3 Key Constraints & Indexes

| Constraint | Table | Field(s) | Type |
|---|---|---|---|
| Unique registration | Vehicle | `registrationNo` | `@unique` |
| Unique license | Driver | `licenseNumber` | `@unique` |
| Unique email | User | `email` | `@unique` |
| FK → Vehicle | Trip, MaintenanceLog, FuelLog, Expense, TelemetryLog | `vehicleId` | `@relation` |
| FK → Driver | Trip | `driverId` | `@relation` |
| Composite index | TelemetryLog | `[vehicleId, timestamp]` | `@@index` |

---

## 4. RabbitMQ Event Architecture

### 4.1 Exchange & Queue Design

```
Exchange: transitops.events (type: topic)

Routing Keys & Queues:
┌──────────────────────────────┬──────────────────────────────────┐
│ Routing Key                  │ Consumer Queue                   │
├──────────────────────────────┼──────────────────────────────────┤
│ trip.dispatched              │ q.status.lock                    │
│                              │ q.telemetry.start                │
│                              │ q.notification.dispatch          │
├──────────────────────────────┼──────────────────────────────────┤
│ trip.completed               │ q.status.unlock                  │
│                              │ q.analytics.trip                 │
│                              │ q.telemetry.stop                 │
├──────────────────────────────┼──────────────────────────────────┤
│ trip.cancelled               │ q.status.unlock                  │
│                              │ q.telemetry.stop                 │
├──────────────────────────────┼──────────────────────────────────┤
│ maintenance.created          │ q.status.vehicle_to_shop         │
│                              │ q.notification.maintenance       │
├──────────────────────────────┼──────────────────────────────────┤
│ maintenance.closed           │ q.status.vehicle_available       │
├──────────────────────────────┼──────────────────────────────────┤
│ vehicle.telemetry_updated    │ q.tracking.broadcast             │
│                              │ q.tracking.persist               │
└──────────────────────────────┴──────────────────────────────────┘
```

### 4.2 Event Payloads

```js
// trip.dispatched
{
  event: 'trip.dispatched',
  tripId: 'uuid',
  vehicleId: 'uuid',
  driverId: 'uuid',
  source: { lat, lng, name },
  destination: { lat, lng, name },
  cargoWeight: 450,
  timestamp: '2026-07-12T10:00:00Z'
}

// trip.completed
{
  event: 'trip.completed',
  tripId: 'uuid',
  vehicleId: 'uuid',
  driverId: 'uuid',
  actualDistance: 320.5,
  fuelConsumed: 42.3,
  revenue: 15000,
  timestamp: '2026-07-12T18:00:00Z'
}

// maintenance.created
{
  event: 'maintenance.created',
  maintenanceId: 'uuid',
  vehicleId: 'uuid',
  description: 'Oil Change',
  timestamp: '2026-07-12T09:00:00Z'
}

// vehicle.telemetry_updated
{
  event: 'vehicle.telemetry_updated',
  vehicleId: 'uuid',
  tripId: 'uuid',
  latitude: 28.6139,
  longitude: 77.2090,
  speed: 65.4,
  heading: 180,
  timestamp: '2026-07-12T10:05:00Z'
}
```

### 4.3 Event Flow Diagram

```
┌──────────┐    POST /trips/:id/dispatch    ┌──────────────┐
│  Client   │ ─────────────────────────────► │ Trip Service  │
│ (React)   │                                │              │
└──────────┘                                 │  1. Validate │
     ▲                                       │  2. Update DB│
     │                                       │  3. Publish  │
     │ WebSocket                             │    event     │
     │ push                                  └──────┬───────┘
     │                                              │
     │                                    ┌─────────▼──────────┐
     │                                    │     RabbitMQ        │
     │                                    │  transitops.events  │
     │                                    └────┬────┬────┬─────┘
     │                                         │    │    │
     │         ┌───────────────────────────────┘    │    └────────────────┐
     │         ▼                                    ▼                    ▼
     │  ┌──────────────┐                   ┌──────────────┐   ┌──────────────┐
     │  │Status Worker  │                  │Telemetry Sim │   │Analytics     │
     │  │Lock vehicle + │                  │Start GPS     │   │Worker        │
     │  │driver ON_TRIP │                  │coordinate    │   │(on complete) │
     │  └──────┬───────┘                   │simulation    │   └──────────────┘
     │         │                           └──────┬───────┘
     │         │ emit via Socket.io               │ every 3 seconds
     │         ▼                                  ▼
     │  ┌──────────────┐                   ┌──────────────┐
     └──│ Socket.io    │◄──────────────────│Tracking      │
        │ Server       │  telemetry events │Consumer      │
        │              │                   │→ broadcast   │
        └──────────────┘                   └──────────────┘
```

---

## 5. WebSocket (Socket.io) Event Channels

### 5.1 Server → Client Events

| Channel | Payload | Triggered By | Purpose |
|---|---|---|---|
| `kpi:update` | `{ activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilization }` | status.worker, analytics.worker | Live dashboard KPI refresh |
| `vehicle:statusChange` | `{ vehicleId, oldStatus, newStatus }` | status.worker | Instant badge flip across all screens |
| `driver:statusChange` | `{ driverId, oldStatus, newStatus }` | status.worker | Instant badge flip |
| `trip:statusChange` | `{ tripId, oldStatus, newStatus }` | trip.producer | Trip list real-time update |
| `telemetry:position` | `{ vehicleId, lat, lng, speed, heading, tripId }` | tracking.consumer | Map marker animation |
| `notification:alert` | `{ type, title, message, severity }` | notification.worker | Toast notifications |

### 5.2 Client-Side Integration

```jsx
// useSocket.js hook pattern
const { subscribe, unsubscribe } = useSocket();

// In DashboardPage:
subscribe('kpi:update', (data) => setKpis(data));

// In FleetMap:
subscribe('telemetry:position', (data) => updateMarker(data));

// In VehicleListPage:
subscribe('vehicle:statusChange', (data) => updateVehicleStatus(data));
```

---

## 6. GPS Telemetry Simulation Engine

Since we don't have real GPS devices, the `tracking.simulator.js` generates realistic coordinate updates:

### 6.1 How It Works

1. When `trip.dispatched` event arrives, the simulator registers a new active simulation.
2. It interpolates coordinates between `source(lat, lng)` and `destination(lat, lng)` along a great-circle path.
3. Every **3 seconds**, it publishes a `vehicle.telemetry_updated` event with the next interpolated position, randomized speed (40-90 km/h), and computed heading.
4. When `trip.completed` or `trip.cancelled` arrives, it stops simulation for that vehicle.

### 6.2 Coordinate Interpolation

```
Given: source(lat₁, lng₁), destination(lat₂, lng₂), progress fraction t ∈ [0, 1]

Interpolated position:
  lat = lat₁ + (lat₂ - lat₁) × t + random_jitter(±0.001°)
  lng = lng₁ + (lng₂ - lng₁) × t + random_jitter(±0.001°)

Speed: 40 + Math.random() × 50 (km/h)
Heading: bearing(current, destination)
Progress increment: Δt = (speed × interval) / totalDistance
```

### 6.3 Seed Data Coordinates (Indian Cities)

| Trip | Source | Destination | Source Coords | Dest Coords |
|---|---|---|---|---|
| Trip 1 | Delhi | Jaipur | 28.6139, 77.2090 | 26.9124, 75.7873 |
| Trip 2 | Mumbai | Pune | 19.0760, 72.8777 | 18.5204, 73.8567 |
| Trip 3 | Bangalore | Chennai | 12.9716, 77.5946 | 13.0827, 80.2707 |
| Trip 4 | Hyderabad | Vijayawada | 17.3850, 78.4867 | 16.5062, 80.6480 |

---

## 7. OpenStreetMap Live Fleet Tracking — Component Design

### 7.1 FleetMap Component

- Uses **React-Leaflet** with OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Renders custom **truck icon markers** for each active vehicle
- Subscribes to `telemetry:position` WebSocket events
- **Smooth marker animation**: uses `leaflet-drift-marker` or CSS transitions to animate position changes (no jumps)
- Color-coded markers by vehicle status (green = Available, blue = On Trip, orange = In Shop, red = Retired)

### 7.2 Vehicle Detail Drawer (Click Interaction)

When a user clicks any truck marker on the map:

```
┌────────────────────────────────────────────────────────────────┐
│  FLEET MAP (full width)                          │  DETAIL    │
│                                                  │  DRAWER    │
│        🚛  ←  animated marker                    │            │
│                                                  │ ┌────────┐ │
│     🚛          🚛                               │ │ TRUCK  │ │
│                                                  │ │ KA-01- │ │
│            🚛                                    │ │ AB-1234│ │
│                          🚛                      │ │On Trip │ │
│                                                  │ └────────┘ │
│   🚛                                             │            │
│                                                  │ ROUTE      │
│                                                  │ Delhi →    │
│                                                  │ Jaipur     │
│                                                  │ 180/320 km │
│                                                  │            │
│                                                  │ DRIVER     │
│                                                  │ Alex Kumar │
│                                                  │ Cat: CE    │
│                                                  │ Score: 92  │
│                                                  │ +91 98xxx  │
│                                                  │            │
│                                                  │ CARGO      │
│                                                  │ 450/500 kg │
│                                                  │            │
│                                                  │ FUEL       │
│                                                  │ 28.5 L     │
│                                                  │ Est: ₹4200 │
└──────────────────────────────────────────────────┴────────────┘
```

**Drawer contents:**
1. **Vehicle Details**: Registration No, Model/Name, Status Badge (color-coded)
2. **Route Info**: Source → Destination, Planned Distance, Distance Covered, progress bar
3. **Allocated Driver**: Name, License Category, Safety Score (star/bar), Contact Number
4. **Cargo Details**: Weight carried vs max capacity (e.g. "450 kg / 500 kg"), visual progress bar
5. **Real-Time Financials**: Fuel consumed on current trip, estimated operational cost

---

## 8. API Route Design

All routes prefixed with `/api`. Auth routes are public; all others require `Authorization: Bearer <token>`.

### 8.1 Auth (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Signup with email, password, name, role |
| POST | `/login` | Public | Login → JWT + user object |
| GET | `/me` | Authenticated | Get current user profile |

### 8.2 Dashboard (`/api/dashboard`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | All authenticated | KPI aggregates |
| GET | `/stats?type=TRUCK&status=AVAILABLE&region=North` | All authenticated | Filtered KPIs |

### 8.3 Vehicles (`/api/vehicles`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | All authenticated | List (filterable, sortable, paginated) |
| GET | `/:id` | All authenticated | Single vehicle + relations |
| POST | `/` | Fleet Manager | Create vehicle |
| PUT | `/:id` | Fleet Manager | Update vehicle |
| DELETE | `/:id` | Fleet Manager | Delete vehicle |
| GET | `/available` | Fleet Manager, Driver | Dispatch-eligible vehicles |
| GET | `/positions` | All authenticated | Current GPS positions of all active vehicles |

### 8.4 Drivers (`/api/drivers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | All authenticated | List drivers |
| GET | `/:id` | All authenticated | Single driver |
| POST | `/` | Fleet Manager | Create driver |
| PUT | `/:id` | Fleet Manager | Update driver |
| DELETE | `/:id` | Fleet Manager | Delete driver |
| GET | `/available` | Fleet Manager, Driver | Dispatch-eligible drivers |
| GET | `/compliance` | Safety Officer, Fleet Mgr | Expired licenses, low safety |

### 8.5 Trips (`/api/trips`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | All (Driver: own only) | List trips |
| GET | `/:id` | All authenticated | Trip detail |
| POST | `/` | Fleet Manager, Driver | Create draft trip |
| PUT | `/:id` | Fleet Manager, Driver | Update draft trip |
| PATCH | `/:id/dispatch` | Fleet Manager, Driver | Draft → Dispatched (publishes event) |
| PATCH | `/:id/complete` | Fleet Manager, Driver | Dispatched → Completed (publishes event) |
| PATCH | `/:id/cancel` | Fleet Manager, Driver | → Cancelled (publishes event) |

### 8.6 Maintenance (`/api/maintenance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Fleet Mgr, Safety Officer | List logs |
| GET | `/:id` | Fleet Mgr, Safety Officer | Single log |
| POST | `/` | Fleet Manager | Create (publishes event → vehicle IN_SHOP) |
| PUT | `/:id` | Fleet Manager | Update |
| PATCH | `/:id/close` | Fleet Manager | Close (publishes event → vehicle AVAILABLE) |
| DELETE | `/:id` | Fleet Manager | Delete |

### 8.7 Fuel (`/api/fuel`) & Expenses (`/api/expenses`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Fleet Mgr, Financial Analyst | List logs |
| POST | `/` | Fleet Manager | Create entry |
| PUT | `/:id` | Fleet Manager | Update entry |
| DELETE | `/:id` | Fleet Manager | Delete entry |

### 8.8 Tracking (`/api/tracking`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/live` | All authenticated | All active vehicle positions (snapshot) |
| GET | `/vehicle/:id/history` | All authenticated | Telemetry history for a vehicle |
| GET | `/trip/:id/trail` | All authenticated | GPS trail for a specific trip |

### 8.9 Reports (`/api/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/fuel-efficiency` | Fleet Mgr, Financial Analyst | Distance/Fuel per vehicle |
| GET | `/fleet-utilization` | Fleet Manager | % time on trip vs available |
| GET | `/operational-cost` | Fleet Mgr, Financial Analyst | Fuel + Maintenance per vehicle |
| GET | `/vehicle-roi` | Fleet Mgr, Financial Analyst | ROI formula |
| GET | `/export/csv?report=<type>` | Fleet Mgr, Financial Analyst | CSV download |

---

## 9. Auth & RBAC

### 9.1 Authentication Flow

1. **Signup**: `POST /api/auth/register` → bcrypt(12 rounds) → store User → return JWT
2. **Login**: `POST /api/auth/login` → verify password → return JWT (24h expiry)
3. **JWT Payload**: `{ id, email, role, iat, exp }`
4. **Client**: JWT in `localStorage`, Axios interceptor adds `Authorization: Bearer <token>`
5. **Server**: `auth.js` middleware verifies token, attaches `req.user`

### 9.2 RBAC Matrix

| Module | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Dashboard | ✅ Full | ✅ Read | ✅ Read | ✅ Read |
| Vehicles | ✅ CRUD | ✅ Read | ✅ Read | ✅ Read |
| Drivers | ✅ CRUD | ✅ Read own | ✅ Read + Flag | ✅ Read |
| Trips | ✅ Full | ✅ Own only | ✅ Read | ✅ Read |
| Maintenance | ✅ CRUD | ❌ | ✅ Read | ❌ |
| Fuel/Expenses | ✅ CRUD | ❌ | ❌ | ✅ Read |
| Reports | ✅ Full | ❌ | ✅ Safety | ✅ Financial |
| Live Tracking | ✅ Full | ✅ Own vehicle | ✅ Read | ✅ Read |

---

## 10. Mandatory Business Rules (Server-Side)

All rules enforced in the **service layer** — frontend only provides UX hints.

| # | Rule | Enforced In |
|---|---|---|
| 1 | Vehicle registration number must be unique | DB `@unique` + service |
| 2 | Retired / In Shop vehicles excluded from dispatch | `vehicle.service.getAvailable()` |
| 3 | Expired-license / Suspended drivers cannot be assigned | `trip.service.create()` |
| 4 | On Trip vehicle/driver cannot be double-assigned | `trip.service.dispatch()` |
| 5 | Cargo weight ≤ vehicle max load capacity | `trip.service.create()` |
| 6 | Dispatch → vehicle + driver ON_TRIP | `trip.producer` → `status.worker` (async) |
| 7 | Complete → vehicle + driver AVAILABLE | `trip.producer` → `status.worker` (async) |
| 8 | Cancel → restore AVAILABLE | `trip.producer` → `status.worker` (async) |
| 9 | Create maintenance → vehicle IN_SHOP | `maintenance.producer` → `status.worker` |
| 10 | Close maintenance → vehicle AVAILABLE (unless Retired) | `maintenance.producer` → `status.worker` |

> [!IMPORTANT]
> Rules 6-10 now flow through **RabbitMQ events** and are processed by background **status.worker**. The initial DB update (trip status change) happens synchronously in a Prisma transaction to guarantee consistency. The cascading status changes and side-effects (telemetry start, notifications) happen asynchronously via event consumers.

---

## 11. Design System — Odoo Theme

### 11.1 Color Tokens

```js
colors: {
  primary:    { DEFAULT: '#714B67', hover: '#875A7B', light: '#F3EDF2' },
  background: { page: '#F8F9FA', panel: '#FFFFFF', muted: '#EEEEEE' },
  border:     { DEFAULT: '#DEE2E6', dark: '#CED4DA' },
  text:       { primary: '#212529', secondary: '#6C757D', muted: '#ADB5BD' },
  status: {
    red:    '#F06050',  // Retired, Cancelled, Suspended
    orange: '#F4A460',  // In Shop, Off Duty
    yellow: '#F7CD1F',  // Draft, Pending
    blue:   '#6CC1ED',  // On Trip, Dispatched
    purple: '#814968',  // Custom
    green:  '#30C381',  // Available, Completed
  }
}
```

### 11.2 Layout, Typography, Components

- **Layout**: Top horizontal bar (#714B67) + collapsible left sidebar + content area on #F8F9FA
- **Typography**: Inter font (locally bundled WOFF2, `@font-face`) — clean, flat, functional
- **Icons**: Lucide React (npm, inline SVG — offline)
- **Buttons**: `rounded-sm`, solid primary purple / white secondary
- **Data Tables**: Minimal borders, status badges as small colored rounded rectangles
- **Maps**: React-Leaflet, OSM tiles, custom truck SVG markers

---

## 12. Docker Compose Setup

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: transitops-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: transitops
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: transitops-mq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"     # AMQP protocol
      - "15672:15672"   # Management UI (http://localhost:15672)
    volumes:
      - mqdata:/var/lib/rabbitmq

volumes:
  pgdata:
  mqdata:
```

```env
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/transitops
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=transitops-super-secret-key-change-in-production
PORT=5000
```

---

## 13. Seed Data

| Entity | Count | Details |
|---|---|---|
| Users | 4 | One per role (all password: `Password123!`) |
| Vehicles | 6 | Mix of types/statuses, includes GPS coordinates for active ones |
| Drivers | 6 | Mix of statuses, one expired license, one suspended |
| Trips | 8 | 2 Draft, 2 Dispatched (with source/dest coords for simulation), 3 Completed, 1 Cancelled |
| Maintenance | 4 | 2 Open, 2 Closed |
| Fuel Logs | 10 | Spread across vehicles |
| Expenses | 6 | Tolls, parking, insurance |
| Telemetry | 20 | Historical GPS points for completed trips |

---

## 14. Key Technical Decisions

| Decision | Rationale |
|---|---|
| **Domain-Driven Modules** | Each feature is self-contained; isolates concerns, eases testing |
| **RabbitMQ (Docker)** | Decouples heavy processing; events survive service restarts with durable queues |
| **Socket.io** | Simpler than raw WS; auto-reconnect, rooms, namespaces; good React support |
| **React-Leaflet + OSM** | Free, no API key; only dependency needing network is tile loading |
| **GPS Simulation** | Realistic demo without hardware; interpolates coords along route |
| **Sync DB + Async side-effects** | Trip status updates are transactional; status cascades are event-driven |
| **amqplib** | Lightweight Node.js RabbitMQ client; no heavy framework needed |
| **Inter font (local)** | WOFF2 bundled in `public/fonts/` — no Google Fonts CDN |
| **Lucide React** | npm SVG icons — fully offline |
| **Recharts** | npm charts — client-side SVG rendering |
| **Tailwind CSS v3** | Stable, mature, matches user spec |

---

## 15. Phase Breakdown

### Phase 1: Scaffolding + Docker + Auth + Event Infrastructure
**What gets built:**
- `docker-compose.yml` with PostgreSQL 16 + RabbitMQ 3.13 (management UI)
- Root `.env` with all connection strings
- Vite React app (client) with Tailwind CSS v3, PostCSS, local Inter fonts
- Express server with domain-module folder structure
- Full `schema.prisma` with all 9 models + enums (including TelemetryLog)
- RabbitMQ connection manager (`config/rabbitmq.js`) + exchange/queue setup
- Socket.io server setup (`config/socket.js`) + event registry
- Auth module: register, login, /me with JWT + RBAC middleware
- Login & Signup pages (Odoo-styled)
- AuthContext, SocketContext, protected routes, Axios interceptors
- Seed script with all sample data
- Event infrastructure: `publisher.js`, `subscriber.js`, `eventTypes.js`

**Done when:** `docker compose up -d` starts PostgreSQL + RabbitMQ. Auth works end-to-end. RabbitMQ management UI accessible at `localhost:15672`. Socket.io connects from frontend. Seed data loads.

---

### Phase 2: Layout Shell + Vehicle & Driver Modules
**What gets built:**
- `AppShell` layout: Odoo top bar + collapsible sidebar + breadcrumbs
- Reusable UI component library (Button, Input, DataTable, StatusBadge, Modal, KpiCard, etc.)
- Vehicle module: full domain stack (route → controller → service → repository)
  - CRUD + `/available` endpoint + `/positions` endpoint
  - `vehicle.producer.js` for status change events
- Driver module: full domain stack
  - CRUD + `/available` + `/compliance` endpoints
- List/Kanban view toggle on all data tables
- Real-time status badge updates via Socket.io (`vehicle:statusChange`, `driver:statusChange`)

**Done when:** Fleet Manager can CRUD vehicles/drivers. Status badges update in real-time across tabs. Sidebar navigation works. Odoo theme is applied.

---

### Phase 3: Trip Lifecycle + Business Rules + Event Publishing
**What gets built:**
- Trip module: full domain stack with lifecycle endpoints
- All 10 business rules enforced server-side
- `trip.producer.js`: publishes `trip.dispatched`, `trip.completed`, `trip.cancelled`
- `status.worker.js`: consumes trip events → locks/unlocks vehicle + driver statuses
- WebSocket broadcast of status changes after worker processes events
- Trip list + form pages with smart dropdowns (only available vehicles/drivers)
- Complete trip modal (actualDistance, fuelConsumed, revenue)
- Driver role sees only own trips

**Done when:** Full trip lifecycle (Draft → Dispatch → Complete/Cancel) works with all business rules. Status transitions cascade via RabbitMQ → worker → Socket.io.

---

### Phase 4: Maintenance + Fuel & Expense Modules
**What gets built:**
- Maintenance module with event-driven status transitions:
  - `maintenance.producer.js`: publishes `maintenance.created`, `maintenance.closed`
  - Status worker handles vehicle IN_SHOP / AVAILABLE transitions
- Fuel log module: CRUD with vehicle association
- Expense module: CRUD with category support
- `notification.worker.js`: in-app alerts for fleet managers (maintenance alerts)
- Toast notifications on frontend via Socket.io
- RBAC enforcement for Financial Analyst (read fuel/expenses)

**Done when:** Maintenance → vehicle goes IN_SHOP asynchronously. Fuel/expense logging works. Toast notifications appear in real-time.

---

### Phase 5: Live Fleet Tracking (OSM Map + GPS Simulation)
**What gets built:**
- `tracking.simulator.js`: GPS coordinate simulation engine
  - Registers active simulations when `trip.dispatched` arrives
  - Interpolates coordinates every 3 seconds
  - Publishes `vehicle.telemetry_updated` events
- `tracking.consumer.js`: persists telemetry + broadcasts via Socket.io
- `telemetry.worker.js`: processes GPS updates → broadcasts `telemetry:position`
- **FleetMap component** (React-Leaflet):
  - Full-screen interactive OSM map
  - Custom truck SVG markers (color-coded by status)
  - Smooth marker animation on position updates
  - Cluster markers when zoomed out
- **VehicleDetailDrawer**: rich side panel on marker click
  - Vehicle info + status badge
  - Route: source → destination + distance progress bar
  - Driver: name, license, safety score, contact
  - Cargo: weight / max capacity bar
  - Real-time fuel consumed + estimated cost
- Tracking REST endpoints (live positions, history, trail)
- Mini fleet map widget on Dashboard page
- `LiveTrackingPage.jsx`: dedicated full-screen tracking view

**Done when:** Dispatched trips show moving truck markers on the map. Clicking a marker opens the detail drawer with all live data. GPS simulation runs automatically for active trips.

---

### Phase 6: Dashboard + Reports + Polish + Final QA
**What gets built:**
- Dashboard KPI cards with **real-time updates** via `kpi:update` Socket.io events
- Dashboard filters (vehicle type, status, region)
- `analytics.worker.js`: recalculates KPIs on trip/maintenance events → broadcasts
- Reports page with 4 analytics views + Recharts visualizations:
  - Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI
- CSV export for each report
- Kanban view for vehicles, drivers, trips
- Responsive layout (tablet-width 768px)
- Micro-animations, loading skeletons, empty states
- Driver compliance view (Safety Officer)
- Complete `README.md` with setup instructions
- Final end-to-end testing of all workflows

**Done when:** Dashboard KPIs update in real-time. All reports render with charts. CSV export works. The app is responsive, polished, and production-ready. README enables clone → run.

---

## 16. Verification Plan

### Automated Verification
- `docker compose up -d` — PostgreSQL + RabbitMQ containers start
- RabbitMQ Management UI at `http://localhost:15672` shows exchanges/queues
- `npx prisma migrate dev` — schema valid, migrations run
- `npx prisma db seed` — sample data loads
- `npm run build` (client) — no compile errors
- Browser DevTools Network tab — no external API calls (only OSM tiles)

### Manual Verification Checklist
- [ ] Docker containers (PostgreSQL + RabbitMQ) start without errors
- [ ] RabbitMQ Management UI shows `transitops.events` exchange and all queues
- [ ] Sign up with each of 4 roles, verify RBAC restrictions
- [ ] Create vehicle with duplicate registration → error
- [ ] Create driver with expired license → cannot be dispatched
- [ ] Trip lifecycle: Draft → Dispatch → Complete with all validations
- [ ] Dispatch trip → vehicle/driver badges flip to "On Trip" in real-time (no refresh)
- [ ] Dispatch trip → truck marker appears on fleet map and starts moving
- [ ] Click moving truck marker → detail drawer shows all info
- [ ] Complete trip → truck marker disappears, badges revert to "Available"
- [ ] Create maintenance → vehicle status changes to "In Shop" asynchronously
- [ ] Dashboard KPIs update in real-time when statuses change
- [ ] Reports generate correct analytics with charts
- [ ] CSV export downloads correctly
- [ ] Responsive layout at 768px width
- [ ] All 10 business rules satisfied
- [ ] Toast notifications appear for dispatches and maintenance alerts

---

## Open Questions

> [!IMPORTANT]
> **1. Continuous phases**: After approval, should I implement all 6 phases continuously, or pause after each phase for your review?

> [!NOTE]
> **2. OSM tiles**: The map uses OpenStreetMap's public tile server (free, no API key). This is the only external network request. For a fully air-gapped environment, we could add a local tile server in Docker, but it requires ~60GB of tile data. Is the public OSM tile server acceptable?

> [!NOTE]
> **3. Tailwind version**: Staying with **Tailwind CSS v3** (stable). Confirm or request v4.

> [!NOTE]
> **4. Ports**: Express `:5000`, Vite `:5173`, PostgreSQL `:5432`, RabbitMQ `:5672` (AMQP) + `:15672` (Management UI). Any conflicts?
