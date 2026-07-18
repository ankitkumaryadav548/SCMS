# 📡 REST API & Socket.io Endpoint Specifications - SCMS

The **Smart City Management System (SCMS)** exposes RESTful endpoints and real-time Socket.io events across the Express backend and Java Spring Boot engine.

---

## 🔐 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registers a new citizen or operator user.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@gmail.com",
    "password": "password123",
    "role": "Citizen"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": { "id": "6697a...", "name": "John Doe", "email": "john@gmail.com", "role": "Citizen" }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates user and issues JWT.
- **Request Body**:
  ```json
  {
    "email": "admin@smartcity.gov",
    "password": "password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": { "id": "6697b...", "name": "Admin User", "email": "admin@smartcity.gov", "role": "Admin" }
  }
  ```

---

## 🚦 2. Traffic & Routing Endpoints (`/api/v1/traffic`)

### `POST /api/v1/traffic/optimize-route`
Calculates shortest/fastest route by querying the Java Spring Boot Engine.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "startNode": "ConnaughtPlace",
    "endNode": "ChandniChowk",
    "customEdges": [
      { "source": "ConnaughtPlace", "target": "IndiaGate", "weight": 1.2 }
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "path": ["ConnaughtPlace", "NewDelhiRailwayStation", "ChandniChowk"],
      "totalCost": 2.0,
      "executionTime": "0.412 ms",
      "comparison": {
        "dijkstra": { "time": "0.412 ms", "nodesVisited": 3 },
        "astar": { "time": "0.380 ms", "nodesVisited": 3 }
      }
    }
  }
  ```

---

## 📅 3. Booking & Queue Endpoints (`/api/v1/bookings`)

### `POST /api/v1/bookings`
Creates a new booking or joins waiting queue.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body (Parking)**:
  ```json
  {
    "type": "Parking",
    "serviceDetails": {
      "name": "A-01",
      "location": "Connaught Place",
      "vehicleNumber": "DL 01 AB 1234",
      "slotId": "6697c..."
    }
  }
  ```
- **Request Body (Waiting Queue)**:
  ```json
  {
    "type": "Waiting Queue",
    "serviceDetails": { "name": "Water line repair Block C", "notes": "Urgent" }
  }
  ```

### `GET /api/v1/bookings/queue`
Returns the live ordered FIFO queue (`Admin` only).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "queueSize": 2,
    "data": [
      { "_id": "6697d...", "userName": "John Doe", "type": "Waiting Queue", "queuePosition": 1 }
    ]
  }
  ```

### `PATCH /api/v1/bookings/:id/approve`
Approves a pending booking (`Admin` only).

---

## 🚨 4. Emergency Incident Endpoints (`/api/v1/emergency`)

### `GET /api/v1/emergency/incidents`
Retrieves active emergency incidents.

### `POST /api/v1/emergency/incidents`
Files a new emergency incident report.
- **Request Body**:
  ```json
  {
    "title": "Substation Fire",
    "description": "Heavy smoke reported",
    "type": "Fire",
    "severity": "Critical",
    "location_lat": 28.6304,
    "location_lng": 77.2177
  }
  ```

---

## ⚡ 5. Socket.io Real-Time Events (`ws://localhost:5050`)

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `traffic_update` | Server -> Client | Broadcasts live density & speed array for all 17 road edges every 2 seconds. |
| `congestion_alert` | Server -> Client | Triggered when density > 75% (`HIGH` / `CRITICAL`). |
| `emergency_route` | Server -> Client | Emits active emergency vehicle tracking (`FIRE-07`) and Dijkstra priority path. |
| `simulation_control` | Client -> Server | Controls simulation execution (`start`, `stop`, `speed`, `spawn_emergency`). |
