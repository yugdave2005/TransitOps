# TransitOps — Smart Transport Operations Platform v2 🚀

[![Production Ready](https://img.shields.io/badge/Architecture-Layered_Domain_Driven-714B67?style=for-the-badge)](https://github.com/yugdave2005/TransitOps)
[![Event Driven](https://img.shields.io/badge/Event_Bus-RabbitMQ_AMQP-FF6600?style=for-the-badge)](https://www.rabbitmq.com/)
[![Real Time](https://img.shields.io/badge/Real_Time-Socket.io_WebSockets-010101?style=for-the-badge)](https://socket.io/)
[![UI Theme](https://img.shields.io/badge/UI_Theme-Odoo_Signature_Plum-714B67?style=for-the-badge)](https://www.odoo.com/)

**TransitOps v2** is a production-grade, distributed, real-time **Transport Operations ERP Platform** built for high-performance fleet monitoring, trip dispatching, business rule enforcement, and live OpenStreetMap GPS telemetry.

---

## 🏗️ Architectural Highlights (Layered Domain-Driven & Event-Driven)

### 1. Isolated Domain Modules (`/server/src/modules/*`)
The backend is strictly divided into functional domain modules rather than technical layers, ensuring clean separation and zero cross-module coupling:
- **`auth`**: JWT session management, Bcrypt hashing, Role-Based Access Control (`FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`).
- **`vehicles`**: Vehicle registry, status lifecycle (`AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`), acquisition cost tracking.
- **`drivers`**: Driver profiles, license validity checking, safety scores (`0-100`), status tracking.
- **`trips`**: Trip dispatching enforcing **10 mandatory business rules** (cargo capacity vs load, license expiry check, state lock validation).
- **`maintenance`**: Shop maintenance logs that automatically toggle vehicle status via asynchronous event workers.
- **`fuel` & `expenses`**: Operational cost logging and odometer tracking.
- **`tracking`**: Real-time OpenStreetMap live tracking and GPS telemetry simulation (`tracking.simulator.js`).

Each domain module implements a strict **5-Layer Architecture**:
`Route → Controller → Service → Repository (Prisma ORM) → Event Publisher / Consumer`

### 2. RabbitMQ Event Bus (`transitops.events` Topic Exchange)
All domain side-effects are decoupled using asynchronous RabbitMQ AMQP messaging:
- **`trip.dispatched`** → `workers/status.worker.js` locks Vehicle and Driver to `ON_TRIP`.
- **`trip.completed` / `trip.cancelled`** → `workers/status.worker.js` unlocks Vehicle and Driver back to `AVAILABLE`.
- **`maintenance.created` / `maintenance.closed`** → Toggles vehicle between `IN_SHOP` and `AVAILABLE`.
- **`vehicle.telemetry_updated`** → `workers/telemetry.worker.js` processes GPS coordinates and pushes to connected web clients.

### 3. Socket.io WebSockets (`/server/src/config/socket.js`)
Zero browser refreshes needed! The frontend connects via real-time WebSocket channels:
- **`kpi:update`**: Live dashboard metrics (active trips, shop count, revenue).
- **`vehicle:statusChange` / `driver:statusChange`**: Real-time status badge flips and table row highlights.
- **`telemetry:position`**: High-frequency GPS coordinate broadcasts along OpenStreetMap routes.
- **`notification:alert`**: Instant toast notifications when critical maintenance or safety violations occur.

### 4. Odoo Theme Design System (`/client`)
The frontend (`Vite + React + Tailwind CSS v3`) faithfully reproduces Odoo's state-of-the-art enterprise UI:
- **Primary Color**: `#714B67` (Odoo Signature Deep Plum).
- **Interactive Views**: Seamless toggle between Kanban board and dense Data Tables.
- **OpenStreetMap Integration**: `React-Leaflet` interactive map with animated truck markers (`VehicleMarker.jsx`) and rich side-drawers (`VehicleDetailDrawer.jsx`).

---

## 👥 2-Person Hackathon Team Structure

To allow simultaneous development without merge conflicts, the codebase is partitioned into:

```
[Phase 0: Shared Core Foundation] (COMPLETED ✅)
       │
       ├─► [Track A: Core Operations & Backend Workers] (Teammate A / Engineer 1)
       │     ├── /modules/vehicles & /modules/drivers
       │     ├── /modules/trips (10 Business Rules)
       │     ├── /workers/status.worker.js & Maintenance/Fuel
       │
       └─► [Track B: Live OSM Map, WebSockets & Odoo UI] (Teammate B / Engineer 2)
             ├── /components/* (Odoo UI component library)
             ├── /modules/tracking + tracking.simulator.js
             ├── /pages/LiveTrackingPage.jsx (OpenStreetMap)
             └── /pages/DashboardPage.jsx & Recharts Analytics
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js (v18 or v20+)
- Docker Desktop (for PostgreSQL & RabbitMQ)

### 1. Start Infrastructure (PostgreSQL + RabbitMQ)
```bash
docker compose up -d
```
*Note: If Docker is unavailable, the application contains built-in resilience fallbacks so you can still run `npm run dev`.*

### 2. Setup Backend (`/server`)
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
*Server runs on `http://localhost:5000`*

### 3. Setup Frontend (`/client`)
```bash
cd client
npm install
npm run dev
```
*Client runs on `http://localhost:5173` (with `/api` proxying to backend)*

### 🔑 Hackathon Demo Credentials
When logging in at `http://localhost:5173/auth/login`, use:
- **Email**: `fleet_mgr@transitops.com` (or `driver@transitops.com`, `safety@transitops.com`, `analyst@transitops.com`)
- **Password**: `Password123!`

---

## 📜 License
Hackathon Project — Built with ❤️ for Advanced Agentic Coding & Systems Engineering.
