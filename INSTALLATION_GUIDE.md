# 💻 Local Installation & Setup Guide - Smart City Management System

This guide covers local environment setup for developers and evaluators to run all three tiers of the Smart City Management System locally on Windows, macOS, or Linux.

---

## 📋 Prerequisites

Before starting, ensure the following software dependencies are installed on your machine:

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **Java Development Kit (JDK)**: `JDK 17` or `JDK 21` ([Download JDK](https://www.oracle.com/java/technologies/downloads/))
- **Apache Maven**: `v3.8.0` or higher ([Download Maven](https://maven.apache.org/))
- **MongoDB Community Server**: `v6.0+` ([Download MongoDB](https://www.mongodb.com/try/download/community)) or MongoDB Atlas URI.

---

## 🚀 Step-by-Step Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/ankitkumaryadav548/SCMS.git
cd SCMS
```

---

### Step 2: Java Spring Boot Algorithm Engine Setup
1. Open terminal and navigate to `java-engine`:
   ```bash
   cd java-engine
   ```
2. Compile project using Maven:
   ```bash
   mvn clean compile
   ```
3. Start the Java Spring Boot Engine:
   ```bash
   mvn spring-boot:run
   ```
   *The Java engine will listen on port `8081`.*
   *Verify health: `http://localhost:8081/api/v1/algorithms/health`*

---

### Step 3: Backend Express API Setup
1. Open a new terminal tab and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment sample file:
   ```bash
   cp .env.example .env
   ```
4. Verify local `.env` settings:
   ```env
   PORT=5050
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/smart_city
   JWT_SECRET=supersecretkeychangeinproduction
   JAVA_ENGINE_URL=http://localhost:8081/api/v1
   ```
5. Start development backend API:
   ```bash
   npm run dev
   ```
   *The backend will automatically connect to MongoDB and seed initial collections (`users`, `traffic_sensors`, `emergency_incidents`, `utility_grids`, `parkingslots`). Listening on port `5050`.*

---

### Step 4: Frontend React Web Client Setup
1. Open a third terminal tab and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start Vite HMR development server:
   ```bash
   npm run dev
   ```
4. Open your web browser at:
   ```
   http://localhost:5173
   ```

---

## 🔑 Demo Quick-Login Credentials

When accessing `http://localhost:5173/login`, use the 1-click Quick Login buttons on the login screen or enter:

| Portal Role | Email | Password | Allowed Modules |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartcity.gov` | `password123` | All 8 Modules (Dashboard, Emergency, Citizens, Departments, Navigation, Booking, Traffic, Utility) |
| **Citizen (Client)** | `john.doe@gmail.com` | `password123` | 4 Client Modules (Navigation, Booking, Traffic, Utility) |

---

## 🛠️ TroubleShooting

- **Port Conflict (Port 8081 / 5050 / 5173 in use)**:
  - PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5050).OwningProcess -Force`
- **MongoDB Connection Error**:
  - Ensure MongoDB service is running: `net start MongoDB` or run `mongod`.
