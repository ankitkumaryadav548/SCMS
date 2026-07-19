# 🏙️ Smart City Management System (SCMS)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen.svg?style=for-the-badge&logo=vercel)](https://scms-git-main-ankitkumaryadav548s-projects.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Java](https://img.shields.io/badge/Java-17%2F25-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)

> 🌐 **Live Web Application URL**: [https://scms-git-main-ankitkumaryadav548s-projects.vercel.app](https://scms-git-main-ankitkumaryadav548s-projects.vercel.app)
>
> *(Recommended Live Deployment Domain — auto-updates on every git push).*

A production-ready, scalable, modular, and professional **Smart City Management System (SCMS)**. SCMS combines a **React 18 + Vite** frontend, a **Node.js Express** API server, a **Java Spring Boot 3** Data Structures & Algorithms (DSA) Engine, and a **MongoDB** database to optimize urban traffic flows, emergency dispatches, and public utility resource allocations.

---

## 📚 Quick Links & Complete Documentation Suite

- 🚀 **[Production Deployment Guide (`DEPLOYMENT.md`)](file:///d:/desktop/DSA_Project/DEPLOYMENT.md)** - Step-by-step deployment to Vercel, Render, Railway, & MongoDB Atlas.
- 💻 **[Local Installation Guide (`INSTALLATION_GUIDE.md`)](file:///d:/desktop/DSA_Project/INSTALLATION_GUIDE.md)** - Complete setup instructions for running all services locally.
- 📡 **[API Specifications (`API_DOCUMENTATION.md`)](file:///d:/desktop/DSA_Project/API_DOCUMENTATION.md)** - Full REST endpoints & Socket.io real-time WebSocket events.
- 📑 **[Comprehensive Project Report (`PROJECT_REPORT.md`)](file:///d:/desktop/DSA_Project/PROJECT_REPORT.md)** - Academic & industrial architecture report.
- 📐 **[System Diagrams Suite (`SYSTEM_DIAGRAMS.md`)](file:///d:/desktop/DSA_Project/SYSTEM_DIAGRAMS.md)** - Mermaid diagrams for Architecture, Sequence, Class, ER, Use Case, Deployment, & DFD (Levels 0–2).
- 🎓 **[Viva & Interview Questions (`VIVA_AND_INTERVIEW_QUESTIONS.md`)](file:///d:/desktop/DSA_Project/VIVA_AND_INTERVIEW_QUESTIONS.md)** - Top 30+ Viva exam & technical interview Q&As.
- 💼 **[Resume & Portfolio Descriptions (`RESUME_DESCRIPTION.md`)](file:///d:/desktop/DSA_Project/RESUME_DESCRIPTION.md)** - CV bullet points & technical skill highlights.

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------+
|                     React 18 + Vite Frontend                      |
|                  http://localhost:5173 (Vercel)                   |
+---------------------------------+---------------------------------+
                                  | (HTTP REST / WebSockets)
                                  v
+---------------------------------+---------------------------------+
|                    Node.js Express API Server                     |
|                  http://localhost:5050 (Render)                   |
+-------------------+-----------------------------+-----------------+
                    |                             |
      (MongoDB Wire Protocol)                     | (HTTP REST)
                    v                             v
+-------------------+---------+  +----------------+-----------------+
|  MongoDB NoSQL Database     |  |    Java Spring Boot DSA Engine   |
|  mongodb://localhost:27017  |  |  http://localhost:8081 (Railway) |
+-----------------------------+  +----------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Tier** | React 18, Vite 6, Tailwind CSS 4, React Router DOM 7, Lucide Icons, Leaflet.js, Chart.js |
| **Backend API Tier** | Node.js v20, Express v4, Socket.io v4 (WebSockets), Mongoose ORM v8, JWT, Bcrypt |
| **DSA Engine Tier** | Java 17/25, Spring Boot 3.2, Maven (`Dijkstra`, `A* Pathfinder`, `Kruskal's MST`) |
| **Database Tier** | MongoDB Community Server / MongoDB Atlas |

---

## 🚀 Quick Local Launch Commands

```bash
# 1. Start Java Spring Boot Engine (Port 8081)
cd java-engine
mvn spring-boot:run

# 2. Start Node.js Express Backend API (Port 5050)
cd backend
npm run dev

# 3. Start React Vite Frontend Client (Port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartcity.gov` | `password123` | Full access to all 8 modules (Dashboard, Emergency, Citizens, Departments, Navigation, Booking, Traffic, Utility) |
| **Citizen (Client)** | `john.doe@gmail.com` | `password123` | Access to Client modules (Navigation, Booking, Traffic, Utility) |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](file:///d:/desktop/DSA_Project/LICENSE) file for details.
