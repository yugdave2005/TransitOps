# TransitOps — Smart Transport Operations ERP Platform v2 🚀

[![Production Ready](https://img.shields.io/badge/Architecture-Layered_Domain_Driven-714B67?style=for-the-badge)](https://github.com/yugdave2005/TransitOps)
[![Event Driven](https://img.shields.io/badge/Event_Bus-RabbitMQ_AMQP-FF6600?style=for-the-badge)](https://www.rabbitmq.com/)
[![Real Time](https://img.shields.io/badge/Real_Time-Socket.io_WebSockets-010101?style=for-the-badge)](https://socket.io/)
[![UI Theme](https://img.shields.io/badge/UI_Theme-Odoo_Signature_Plum-714B67?style=for-the-badge)](https://www.odoo.com/)
[![Map Engine](https://img.shields.io/badge/Map_Engine-React_Leaflet_OSM-28a745?style=for-the-badge)](https://react-leaflet.js.org/)

**TransitOps v2** is a production-grade, distributed, real-time **Transport Operations & Fleet Management ERP Platform** built for high-performance asset monitoring, automated trip dispatching, strict business rule enforcement, and live OpenStreetMap GPS telemetry.

---

## 👥 Project Contributors & Collaborators

| Role / Track | Collaborator Name | GitHub Username / Contact | Key Domain Ownership |
| :--- | :--- | :--- | :--- |
| **Track A Lead** | **Yug Dave** | `yugdave2005` (`yugadave@gmail.com`) | Core ERP Operations (`Vehicles`, `Drivers`, `Trips`, `Maintenance`, `Fuel`, `Expenses`, `status.worker.js`) |
| **Track B Lead** | **Samarth Thakkar** | `samarththakkar` (`samarththakkar841@gmail.com`) | Frontend & Live Operations (`Odoo UI Library`, `AppLayout`, `OpenStreetMap Tracking`, `GPS Simulator`, `Recharts Analytics`) |

---

## 🏗️ Architectural Highlights (5-Layer Domain-Driven & Decoupled Event Bus)

### 1. Isolated Domain Modules (`/server/src/modules/*`)
The backend is strictly modularized by domain boundary rather than technical layers, ensuring high cohesion and zero cross-module coupling:
- **`auth`**: JWT session management, Bcrypt hashing, Role-Based Access Control (`FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`).
- **`vehicles`**: Vehicle registry, status lifecycle (`AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`), acquisition cost & fuel efficiency tracking.
- **`drivers`**: Driver profiles, commercial license validity verification, safety audit scores (`0 - 100 Index`).
- **`trips`**: Trip dispatching engine enforcing **10 mandatory business rules** (cargo capacity vs load, license expiry check, state interlocks).
- **`maintenance`**: Shop maintenance orders with automatic interlock switching of `Vehicle` status (`IN_SHOP` ↔ `AVAILABLE`).
- **`fuel` & `expenses`**: Operational cost ledgers and automated odometer progression validation (`Rule 9`).
- **`tracking`**: Real-time OpenStreetMap live tracking and GPS telemetry simulation engine (`tracking.simulator.js`).
- **`reports`**: Cross-domain aggregation engine generating executive analytics and time-series cost trends.

Every module strictly enforces a **5-Layer Architecture**:
`Route Router → Express Controller → Domain Service → Repository (Prisma ORM) → AMQP Event Producer / Consumer`

### 2. Decoupled RabbitMQ Event Bus (`transitops.events` Topic Exchange)
All cross-domain side-effects are decoupled using asynchronous RabbitMQ AMQP messaging with fault-tolerant worker consumers:
- **`trip.dispatched`** → `workers/status.worker.js` locks both `Vehicle` and `Driver` status to `ON_TRIP` instantly.
- **`trip.completed` / `trip.cancelled`** → `workers/status.worker.js` unlocks `Vehicle` and `Driver` back to `AVAILABLE`.
- **`maintenance.logged` / `completed`** → Locks asset to `IN_SHOP` during active repairs and releases on completion (`Rule 2`).
- **`vehicle.telemetry_updated`** → `workers/telemetry.worker.js` ingests 3-second GPS pulses and broadcasts them via Socket.io.
- **`analytics:updated`** → `workers/analytics.worker.js` broadcasts 15-second KPI snapshots for real-time Recharts rendering.

### 3. Socket.io Real-Time WebSockets (`/server/src/config/socket.js`)
Zero browser refreshes required! The frontend subscribes to real-time WebSocket channels:
- **`vehicle:statusChange` / `driver:statusChange`**: Real-time status badge transitions and table row updates across all open sessions.
- **`vehicle:telemetry`**: High-frequency GPS coordinate broadcasts moving animated truck icons across OpenStreetMap corridors.
- **`analytics:updated`**: Live chart data synchronization for command center KPI tiles.
- **`notification:alert`**: Instant toast alerts when critical maintenance checks or dispatch events occur.

### 4. Odoo Signature UI/UX Theme (`/client`)
The frontend (`Vite + React + Tailwind CSS v3`) faithfully reproduces Odoo's state-of-the-art enterprise ERP aesthetic:
- **Primary Color Palette**: `#714B67` (Odoo Signature Deep Plum) and `#875A7B` (Secondary Amethyst).
- **Interactive Views**: Seamless toggling between **Kanban Cards** and **Dense Data Tables**.
- **OpenStreetMap GIS**: `React-Leaflet` interactive map with custom animated `divIcon` markers (`#28a745` for `AVAILABLE`, `#007bff` with live ping pulse for `ON_TRIP`, `#fd7e14` for `IN_SHOP`) and slide-over telemetry drawers.

---

## 🔒 The 10 Mandatory Trip Dispatching & Safety Business Rules Enforced

Our backend `trip.service.js` and `maintenance.service.js` strictly enforce these 10 core operational rules before any asset can move:

1. **Cargo Capacity Check**: Trip `cargoWeight` (`kg`) cannot exceed the assigned vehicle's maximum payload (`capacity`).
2. **Vehicle Availability Lock**: A vehicle whose current status is `ON_TRIP`, `IN_SHOP`, or `RETIRED` cannot be dispatched on a new trip.
3. **Driver Availability Lock**: A driver whose current status is `ON_TRIP`, `SUSPENDED`, or `INACTIVE` cannot be assigned to a new trip.
4. **Commercial License Validity Check**: A driver whose `licenseExpiry` date is in the past (`< new Date()`) is barred from operating fleet vehicles.
5. **Atomic State Transition**: Creating a trip (`DISPATCHED`) must atomically lock both `Vehicle.status = ON_TRIP` and `Driver.status = ON_TRIP` inside a single DB transaction.
6. **Lifecycle Completion Interlock**: Completing or cancelling a trip must atomically release both `Vehicle.status = AVAILABLE` and `Driver.status = AVAILABLE` (unless undergoing shop repairs).
7. **Maintenance State Lock**: Creating a shop maintenance order (`SCHEDULED` or `IN_PROGRESS`) automatically transitions `Vehicle.status = IN_SHOP`, blocking trip dispatching.
8. **Maintenance Release Interlock**: Marking a shop maintenance order as `COMPLETED` or `CANCELLED` automatically restores `Vehicle.status = AVAILABLE`.
9. **Odometer Progression Validation**: Fuel fill-up logs (`FuelLog`) require that the reported `odometerReading` (`km`) is greater than or equal to the vehicle's master odometer reading (`odometer`).
10. **RBAC Security Enforcement**: Sensitive operations (`POST /api/trips`, `POST /api/maintenance`, `POST /api/tracking/simulate/toggle`) are strictly restricted to authorized JWT roles (`FLEET_MANAGER`, `SAFETY_OFFICER`, `DRIVER`).

---

## 🗺️ OpenStreetMap Telemetry & Route Simulation Corridors

The built-in GPS telemetry engine (`/server/src/modules/tracking/tracking.simulator.js`) simulates realistic freight movement along major Indian transport corridors every 3 seconds (`tickSimulation`):

- **`MUMBAI_PUNE`**: Mumbai Port ➔ Navi Mumbai ➔ Lonavala Ghat ➔ Pimpri-Chinchwad ➔ Pune MIDC Hub (`18.9400, 73.0297` to `18.5204, 73.8567`).
- **`DELHI_JAIPUR`**: Delhi Depot ➔ Gurugram Hub ➔ Rewari Checkpost ➔ Alwar Bypass ➔ Jaipur Hub (`28.6139, 77.2090` to `26.9124, 75.7873`).
- **`BANGALORE_CHENNAI`**: Bangalore Peenya ➔ Hosur Border ➔ Krishnagiri Hub ➔ Vellore Toll ➔ Chennai Harbor Depot (`12.9716, 77.5946` to `13.0827, 80.2707`).

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18 or v20+
- **PostgreSQL**: v16+ (Local or Docker)
- **RabbitMQ**: 3.13+ (Local or Docker)

### 1. Start Infrastructure (PostgreSQL + RabbitMQ)
If using Docker Desktop:
```bash
docker compose up -d
```
*Note: If Windows Docker `npipe` errors occur, run local native PostgreSQL (`localhost:5432`) and RabbitMQ (`localhost:5672`). The application contains automatic fallbacks for direct local execution.*

### 2. Setup & Seed Backend (`/server`)
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
*Backend API and WebSocket server run on `http://localhost:5000`*

### 3. Setup & Run Frontend (`/client`)
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with instant proxy forwarding to `/api`.*

---

## 🔑 Hackathon Demo Credentials

When logging in at `http://localhost:5173/auth/login`, use any of our seeded demo accounts:

| Role | Email Address | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Fleet Manager** | `fleet_mgr@transitops.com` | `Password123!` | Full admin access (`Vehicles`, `Drivers`, `Trips`, `Maintenance`, `Sim Toggle`, `Reports`) |
| **Safety Officer** | `safety@transitops.com` | `Password123!` | Audit access (`Driver Safety`, `Maintenance`, `GPS Simulator Control`, `Reports`) |
| **Driver** | `driver@transitops.com` | `Password123!` | Operational access (`Assigned Trips`, `Fuel Logging`) |
| **Financial Analyst** | `analyst@transitops.com` | `Password123!` | Accounting access (`Expenses`, `Fuel Ledgers`, `CSV/JSON Exports`) |

---

## 📜 License & Attribution

Built for **Advanced Agentic Coding & Systems Engineering**.
All code committed cleanly across dedicated tracks by **Yug Dave (`yugdave2005`)** and **Samarth Thakkar (`samarththakkar`)**.
