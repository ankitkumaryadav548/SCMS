# Smart City Management System (SCMS)

A production-ready, scalable, modular, and professional Smart City Management System final year project. This system utilizes a multi-tier MVC architecture combining a Node.js Express API, a Java Spring Boot Algorithm/DSA Engine, and a React + Vite responsive frontend, all stored and managed in a clean monorepo.

---

## 🏗️ Project Architecture

```
                                  +-----------------------+
                                  |   React.js Frontend   |
                                  |   (Vite + Tailwind)   |
                                  +-----------+-----------+
                                              | (HTTP/WebSockets)
                                              v
                                  +-----------+-----------+
                                  |   Node.js Express     |
                                  |     Backend API       |
                                  +-----+-----------+-----+
                                        |           | (HTTP REST)
                           (MySQL Auth) |           v
                                        |     +-----+-----+
                                        v     | Java Spring |
                                  +-----+---+ | Boot Engine |
                                  | MySQL DB| | (DSA)       |
                                  +---------+ +-------------+
```

### 📂 Folder Structure Overview

- [frontend/](file:///d:/desktop/DSA_Project/frontend): Responsive dashboard with charts and real-time maps.
- [backend/](file:///d:/desktop/DSA_Project/backend): Core REST API, socket servers for traffic flows, user authentication, and data controllers.
- [java-engine/](file:///d:/desktop/DSA_Project/java-engine): Maven application encapsulating pathfinding (Dijkstra) and optimization algorithms.
- [database/](file:///d:/desktop/DSA_Project/database): Schemas, seed scripts, and configuration logic for MySQL.
- [documentation/](file:///d:/desktop/DSA_Project/documentation): Unified system specifications, ER Diagrams, and API blueprints.

---

## 🛠️ Technology Stack & Dependencies

### Frontend
- **Framework**: React.js 18 (Vite)
- **Styling**: Tailwind CSS, PostCSS
- **Navigation**: React Router DOM
- **HTTP Client**: Axios
- **Maps**: Leaflet.js, React Leaflet
- **Analytics/Charts**: Chart.js, React-Chartjs-2

### Backend API
- **Runtime**: Node.js & Express
- **Database Connector**: MySQL2
- **Auth**: JWT (JsonWebToken) & bcryptjs
- **Real-time Engine**: Socket.io
- **File Uploads**: Multer
- **Validation/Security**: Helmet, Cors, Morgan

### Algorithm Engine
- **Framework**: Java Spring Boot 3
- **Build Tool**: Maven
- **DSA Core**: Custom graph and grid algorithms (Dijkstra's shortest path, Kruskal's MST, A* pathfinding, BFS/DFS).

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18+)
- Java JDK 17+
- Maven 3.x+
- MySQL Server

### 1. Database Setup
1. Create a MySQL database called `smart_city`.
2. Execute the base schema and seed data from the [database/](file:///d:/desktop/DSA_Project/database) folder:
   ```bash
   mysql -u root -p smart_city < database/schema.sql
   mysql -u root -p smart_city < database/seed.sql
   ```

### 2. Java Engine Setup
1. Navigate to the `java-engine` directory.
2. Compile and run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   *The engine will start on port `8081`.*

### 3. Backend Express API Setup
1. Navigate to the `backend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy environment sample and add details (DB credentials, JWT Secret, Java Engine endpoint):
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   *The API will start on port `5000`.*

### 4. Frontend React Setup
1. Navigate to the `frontend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Start the dev client:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 📝 Authors & Project Specifications
This project is configured under clean architecture patterns and MVC. Refer to the [documentation/](file:///d:/desktop/DSA_Project/documentation) directory for ER diagrams and API schema blueprints.
