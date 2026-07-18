# 📐 System Diagrams Suite - Smart City Management System (SCMS)

This document contains all formal architectural and software engineering diagrams for the **Smart City Management System (SCMS)**, formatted using GitHub-compatible Mermaid diagrams.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Client Tier
        ReactApp["React 18 + Vite Frontend<br/>(Tailwind CSS, Leaflet.js)"]
    end

    subgraph API Tier
        NodeServer["Node.js + Express API Server"]
        SocketEngine["Socket.io WebSocket Engine"]
        AuthMiddleware["JWT Auth & RBAC Middleware"]
    end

    subgraph Algorithm Tier
        JavaEngine["Java Spring Boot 3 Engine<br/>(Dijkstra, A*, Kruskal MST)"]
    end

    subgraph Data Tier
        MongoDB[(MongoDB Atlas / Local DB)]
    end

    ReactApp -->|HTTPS REST| AuthMiddleware
    AuthMiddleware --> NodeServer
    ReactApp <-->|WebSockets| SocketEngine
    NodeServer -->|HTTP REST| JavaEngine
    NodeServer <-->|Mongoose ORM| MongoDB
```

---

## 2. Sequence Diagram (Emergency Priority Route Calculation)

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Control Room Operator
    participant Client as React Frontend
    participant Express as Node.js Express API
    participant Java as Java Spring Boot Engine
    participant DB as MongoDB Database

    Operator->>Client: Click "Dispatch Emergency Unit"
    Client->>Express: POST /api/v1/emergency/incidents (Incident Details)
    Express->>DB: Save Incident (Status: Dispatched)
    Express->>Java: POST /algorithms/shortest-path (Start, End, Live Weights)
    Java->>Java: Execute Dijkstra Algorithm
    Java-->>Express: Return Optimal Emergency Path & Latency
    Express->>Express: Penalize Primary Edges (3x Weight)
    Express->>Java: POST /algorithms/shortest-path (Penalized Edges)
    Java-->>Express: Return Civilian Alternative Path
    Express->>Client: Emit WebSocket 'emergency_route' Event
    Client->>Operator: Highlight Primary (Blue) & Alt (Purple) Routes on Map
```

---

## 3. Class Diagram (Core Backend & Algorithm Entities)

```mermaid
classDiagram
    class User {
        +ObjectId id
        +String name
        +String email
        +String password
        +String role
        +register()
        +login()
    }

    class Booking {
        +ObjectId id
        +ObjectId userId
        +String type
        +Object serviceDetails
        +String status
        +Number queuePosition
        +cancel()
        +approve()
    }

    class ParkingSlot {
        +ObjectId id
        +String slotNumber
        +String zone
        +String status
        +Number pricePerHour
        +reserve()
    }

    class DijkstraEngine {
        +findShortestPath(graph, start, end) PathResult
    }

    class KruskalEngine {
        +computeMST(nodes, edges) MstResult
    }

    User "1" -- "0..*" Booking : places
    Booking "0..1" -- "1" ParkingSlot : reserves
    DijkstraEngine ..> Booking : calculates route
    KruskalEngine ..> User : layout optimization
```

---

## 4. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "places"
    USERS ||--o{ EMERGENCY_INCIDENTS : "reports"
    BOOKINGS }o--|| PARKING_SLOTS : "reserves"
    TRAFFIC_SENSORS ||--o{ TRAFFIC_LOGS : "records"

    USERS {
        ObjectId _id PK
        string name
        string email
        string role
    }

    BOOKINGS {
        ObjectId _id PK
        ObjectId userId FK
        string type
        string status
        int queuePosition
    }

    PARKING_SLOTS {
        ObjectId _id PK
        string slotNumber
        string zone
        string status
    }

    EMERGENCY_INCIDENTS {
        ObjectId _id PK
        string title
        string type
        string severity
        float location_lat
        float location_lng
    }
```

---

## 5. Use Case Diagram

```mermaid
graph LR
    actor Citizen as Citizen Client
    actor Admin as Admin Operator

    subgraph SCMS System
        UC1(Calculate Route)
        UC2(Book Parking / Join Queue)
        UC3(View Live Traffic Heatmap)
        UC4(Approve / Reject Bookings)
        UC5(Dispatch Emergency Units)
        UC6(Manage Citizens & Departments)
        UC7(Optimize Utility Grid MST)
    end

    Citizen --> UC1
    Citizen --> UC2
    Citizen --> UC3

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
```

---

## 6. Deployment Diagram

```mermaid
graph TB
    subgraph Client Browser
        Vercel["Vercel CDN<br/>React 18 SPA Client"]
    end

    subgraph Cloud Backend
        Render["Render Cloud<br/>Node.js Express Server"]
        Railway["Railway Cloud<br/>Java Spring Boot Container"]
        Atlas[(MongoDB Atlas Cloud Cluster)]
    end

    Vercel -->|HTTPS / WSS| Render
    Render -->|HTTP REST| Railway
    Render -->|TLS Mongo Driver| Atlas
```

---

## 7. Data Flow Diagrams (DFD)

### DFD Level 0 (Context Diagram)
```mermaid
graph TD
    User[Citizen / Admin User] -->|Inputs Search, Booking, Incidents| SCMS((Smart City Management System))
    SCMS -->|Returns Routes, Queue Status, Heatmap| User
```

### DFD Level 1
```mermaid
graph TD
    User[User] -->|Auth Request| P1(1.0 Auth Subsystem)
    P1 -->|Issue JWT| User
    User -->|Route Request| P2(2.0 Routing Subsystem)
    P2 -->|Query Java Engine| JavaEng[Java Engine]
    P2 -->|Route Output| User
    User -->|Booking Request| P3(3.0 Booking Subsystem)
    P3 -->|Write Document| DB[(MongoDB)]
```

### DFD Level 2 (Booking & Queue Process)
```mermaid
graph TD
    Citizen[Citizen] -->|Submit Booking| P3_1(3.1 Validate Slot Availability)
    P3_1 -->|Available| P3_2(3.2 Reserve Parking Slot)
    P3_1 -->|Full / Service| P3_3(3.3 Enqueue in FIFO Waitlist)
    P3_3 -->|Update Queue Position| DB[(Bookings Collection)]
    Admin[Admin] -->|Approve Request| P3_4(3.4 Dequeue & Notify Client)
    P3_4 --> DB
```
