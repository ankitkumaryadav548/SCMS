# Smart City API Reference Manual

This document outlines the REST endpoints exposed by the Node.js API and the Java Algorithm Engine.

---

## 🟢 Node.js Backend API (Port 5000)
All backend REST routes are prefixed with `/api/v1`.

### 1. Authentication (`/auth`)

#### `POST /auth/register`
Creates a new user account.
- **Body parameters**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@smartcity.gov",
    "password": "securepassword",
    "role": "Operator" // Optional. Defaults to "Citizen"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "token": "eyJhbGciOi...",
    "user": { "id": 4, "name": "Jane Doe", "email": "jane.doe@smartcity.gov", "role": "Operator" }
  }
  ```

#### `POST /auth/login`
Authenticates an existing user.
- **Body parameters**:
  ```json
  {
    "email": "jane.doe@smartcity.gov",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": 4, "name": "Jane Doe", "email": "jane.doe@smartcity.gov", "role": "Operator" }
  }
  ```

---

### 2. Traffic Management (`/traffic`)

#### `GET /traffic/sensors`
Retrieves all sensors and current status metrics.
- **Authentication**: Required (JWT Bearer Token).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": 1,
        "name": "Main Crossroad",
        "location_lat": "40.71280000",
        "location_lng": "-74.00600000",
        "status": "Active",
        "current_density": 45,
        "avg_speed": "35.50"
      }
    ]
  }
  ```

#### `PUT /traffic/sensors/:id`
Updates a sensor's density and avg_speed and emits Socket.io update.
- **Authentication**: Required (Operator/Admin only).
- **Body parameters**:
  ```json
  {
    "current_density": 85,
    "avg_speed": 14.2
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Sensor updated successfully."
  }
  ```

#### `POST /traffic/optimize-route`
Proxies requests to the Java Spring Boot Engine to determine shortest path between two points.
- **Authentication**: Required.
- **Body parameters**:
  ```json
  {
    "startNode": "Node1",
    "endNode": "Node5"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "path": ["Node1", "Node3", "Node2", "Node4", "Node5"],
      "totalCost": 7.0,
      "executionTime": "0.145 ms"
    }
  }
  ```

---

### 3. Emergency Alerts (`/emergency`)

#### `GET /emergency/incidents`
Lists all tracked incidents (Fire, Accidents, Floods, etc.).
- **Authentication**: Required.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "title": "Substation Fire",
        "type": "Fire",
        "severity": "Critical",
        "status": "Dispatched"
      }
    ]
  }
  ```

#### `POST /emergency/incidents`
Reports a new active incident. Emits real-time event.
- **Authentication**: Required.
- **Body parameters**:
  ```json
  {
    "title": "Route 9 Water Leak",
    "description": "Burst main pipe.",
    "type": "Flood",
    "severity": "High",
    "location_lat": 40.73,
    "location_lng": -73.98
  }
  ```

#### `PATCH /emergency/incidents/:id/status`
Updates status of response efforts (e.g. from "Reported" to "Dispatched" or "Resolved").
- **Authentication**: Required (Operator/Admin only).
- **Body parameters**:
  ```json
  {
    "status": "Resolved"
  }
  ```

---

### 4. Utility Grids (`/utility`)

#### `GET /utility/grids`
Retrieves load parameters of City utilities.
- **Authentication**: Required.

#### `POST /utility/optimize-distribution`
Calculates optimal spanning routing layout between multiple grids (MST) via Java engine.
- **Authentication**: Required (Operator/Admin only).
- **Body parameters**:
  ```json
  {
    "nodeIds": ["SubstationA", "ReservoirB", "DistributaryC"]
  }
  ```

---

## ☕ Java Spring Boot Engine (Port 8081)
Context Path: `/api/v1`

### 1. `POST /algorithms/shortest-path`
Runs Dijkstra's Algorithm on a graph.
- **Body**:
  ```json
  {
    "startNode": "Node1",
    "endNode": "Node5"
  }
  ```
- **Response**:
  ```json
  {
    "path": ["Node1", "Node3", "Node2", "Node4", "Node5"],
    "totalCost": 7.0,
    "executionTime": "0.142 ms"
  }
  ```

### 2. `POST /algorithms/mst`
Runs Kruskal's Algorithm to find the Minimum Spanning Tree connections.
- **Body**:
  ```json
  {
    "nodeIds": ["SubstationA", "ReservoirB", "DistributaryC"]
  }
  ```
- **Response**:
  ```json
  {
    "mstEdges": [
      { "source": "ReservoirB", "target": "DistributaryC", "weight": 5.0 },
      { "source": "SubstationA", "target": "ReservoirB", "weight": 15.0 }
    ],
    "totalCost": 20.0,
    "executionTime": "0.088 ms"
  }
  ```

### 3. `GET /algorithms/health`
Checks service status.
- **Response**: `"Java Algorithm Engine is UP and running."`
