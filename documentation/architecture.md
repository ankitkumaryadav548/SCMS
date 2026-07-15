# System Architecture Design

This document details the clean architecture layout and MVC (Model-View-Controller) structure of the Smart City Management System (SCMS).

---

## 🌟 Architectural Principles

The project is structured under **Clean Architecture** patterns to enforce separation of concerns, testability, and modularity:

1. **Separation of Layers**: UI elements know nothing of DB schemas or algorithm structures. Calculations are decoupled into a dedicated Spring Boot engine.
2. **Framework Independence**: The algorithm logic is written in plain Java (OOP) in a way that can be ported to other execution layers if necessary.
3. **Real-time Event-Driven Interfaces**: Core emergencies and traffic sensors propagate updates instantly using Socket.io to listeners, updating visual widgets without manual page polling.

---

## 🗺️ Architectural Mapping

```
      +------------------------------------------------------------+
      |                       PRESENTATION                         |
      |   React.js Client (Vite, Tailwind, React Router)           |
      |   Visualized Maps (Leaflet), Analytics Widgets (Chart.js)  |
      +-----------------------------+------------------------------+
                                    | (JSON over REST / WebSockets)
                                    v
      +------------------------------------------------------------+
      |                     CORE BACKEND API                       |
      |   Express.js API Layer (Controllers, Middlewares, Routes)  |
      |   Real-Time Broadcast Engine (Socket.io)                   |
      +-----------------------------+------------------------------+
                                    |
                  +-----------------+-----------------+
                  | (TCP Pool)                        | (REST Requests)
                  v                                   v
      +-----------+-----------+           +-----------+-----------+
      |       DATABASE        |           |   ALGORITHM ENGINE    |
      |   MySQL 8.x Instance  |           |   Java Spring Boot    |
      |   (Schema & Seed data)|           |   Dijkstra, Kruskal   |
      +-----------------------+           +-----------------------+
```

---

## 📂 Core Modules and Responsibility Matrix

### 1. Presentation (Frontend - `/frontend`)
- **App Wrapper & Routing**: Enforces route protection via `AuthContext.jsx`.
- **Pages**:
  - `Dashboard`: Aggregates active incident metrics, sensor graphs, and live locations.
  - `Traffic`: Triggers source-to-destination Dijkstra calculations.
  - `Utility`: Resolves minimum spanning distribution grids.
  - `Emergency`: Lists emergency incidents.
- **Services (`api.js`)**: Encapsulates Axios instances with request interceptors attaching user tokens.

### 2. Backend Orchestration (API Gateway - `/backend`)
- **Server Entry (`server.js`)**: Builds Express listeners and Socket connections.
- **Controllers**:
  - `auth.controller.js`: Processes encryption of passwords and JWT token distribution.
  - `traffic.controller.js`: Fetches speed sensor arrays and queries the Java DSA engine.
  - `emergency.controller.js`: Saves emergency incidents and broadcasts updates to operators.
  - `utility.controller.js`: Connects electrical grids and calculates MST topology.
- **Middleware (`auth.js`)**: Restricts roles and blocks requests without authorization.

### 3. Algorithm Engine (Java - `/java-engine`)
- **Spring Controller (`AlgorithmController`)**: Exposes API endpoints.
- **Algorithm Implementations (`/algorithms`)**:
  - `Dijkstra.java`: Executes Dijkstra's single-source shortest path calculation.
  - `Kruskal.java`: Executes Kruskal's Minimum Spanning Tree connecting grid vertices.
