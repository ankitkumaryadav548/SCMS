# 🚀 Production Deployment Guide - Smart City Management System (SCMS)

This guide provides step-by-step instructions for deploying all tiers of the **Smart City Management System (SCMS)** to cloud production platforms.

---

## 🏗️ Production Architecture Overview

```
+-------------------------------------------------------------------+
|                     Vercel (React + Vite)                         |
|                   https://scms-lac.vercel.app                     |
+---------------------------------+---------------------------------+
                                  | (HTTPS REST / WebSockets)
                                  v
+---------------------------------+---------------------------------+
|                    Render (Node.js + Express)                     |
|              https://smart-city-backend.onrender.com              |
+-------------------+-----------------------------+-----------------+
                    |                             |
      (MongoDB Wire Protocol)                     | (HTTP REST)
                    v                             v
+-------------------+---------+  +----------------+-----------------+
|   MongoDB Atlas (Cloud)     |  |    Railway (Java Spring Boot)    |
|   smart_city Cluster        |  |  https://scms-engine.railway.app |
+-----------------------------+  +----------------------------------+
```

---

## 🗄️ 1. Database Deployment (MongoDB Atlas)

1. **Create Atlas Cluster**:
   - Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a new M0 (Free Tier) or M10 Cluster in your preferred region (e.g. AWS `ap-south-1` Mumbai).

2. **Configure Database Access**:
   - Navigate to **Security -> Database Access**.
   - Add a new database user: Username `smartcity_admin`, Password (generate secure password).

3. **Configure Network Access**:
   - Navigate to **Security -> Network Access**.
   - Click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** for cloud server access.

4. **Obtain Connection String**:
   - Click **Connect** -> **Drivers** -> Copy the connection string:
     ```bash
     mongodb+srv://smartcity_admin:<PASSWORD>@cluster0.mongodb.net/smart_city?retryWrites=true&w=majority
     ```

---

## ☕ 2. Algorithm Engine Deployment (Railway - Java Spring Boot)

1. **Repository Setup**:
   - Ensure [`java-engine/Dockerfile`](file:///d:/desktop/DSA_Project/java-engine/Dockerfile) is pushed to your GitHub repository.

2. **Deploy on Railway**:
   - Log in to [Railway.app](https://railway.app).
   - Click **New Project** -> **Deploy from GitHub Repo**.
   - Select the `SCMS` repository and set the Root Directory to `/java-engine`.

3. **Environment Variables on Railway**:
   - `PORT`: `8081`
   - `JAVA_OPTS`: `-Xms256m -Xmx512m`

4. **Expose Public URL**:
   - In Railway Settings, generate a public domain (e.g., `https://scms-java-engine-production.up.railway.app`).
   - Test health endpoint: `https://scms-java-engine-production.up.railway.app/api/v1/algorithms/health`

---

## 🟢 3. Backend API Deployment (Render - Node.js Express)

1. **Deploy on Render**:
   - Log in to [Render.com](https://render.com).
   - Click **New Web Service** -> Connect your GitHub repository.
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `node src/server.js`

2. **Configure Environment Variables on Render**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `5050` | Server listening port |
   | `NODE_ENV` | `production` | Production environment flag |
   | `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas Connection String |
   | `JWT_SECRET` | `super_secret_jwt_key_prod_2026` | Production JWT Token Key |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
   | `JAVA_ENGINE_URL` | `https://scms-java-engine-production.up.railway.app/api/v1` | Public URL of Railway Java Engine |

3. **Verify API Endpoint**:
   - Test backend root endpoint: `https://smart-city-backend.onrender.com/`

---

## ⚡ 4. Frontend Web App Deployment (Vercel - React + Vite)

1. **Deploy on Vercel**:
   - Log in to [Vercel.com](https://vercel.com).
   - Click **Add New** -> **Project** -> Import `ankitkumaryadav548/SCMS` repository.
   - **CRITICAL SETTINGS IN VERCEL DASHBOARD**:
     - **Framework Preset**: Select **`Vite`** (do NOT select Create React App or Other).
     - **Root Directory**: Click Edit and enter **`frontend`** (or click `./frontend`).
     - **Build Command**: `vite build` (or leave default).
     - **Output Directory**: `dist` (or leave default).

2. **Configure Environment Variables on Vercel**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://smart-city-backend.onrender.com/api/v1` | Public Render Backend URL |
   | `VITE_SOCKET_URL` | `https://smart-city-backend.onrender.com` | Public Render WebSocket URL |

3. **Deploy & SPA Rewrite**:
   - Both [`vercel.json`](file:///d:/desktop/DSA_Project/vercel.json) and [`frontend/vercel.json`](file:///d:/desktop/DSA_Project/frontend/vercel.json) are included to handle Vite builds and single-page routing automatically.
   - Click **Deploy**. Your app will build cleanly without any `react-scripts` errors.

---

## 🔒 Complete Environment Variables Checklist

### Backend (`backend/.env`)
```env
PORT=5050
NODE_ENV=production
MONGO_URI=mongodb+srv://smartcity_admin:<PASSWORD>@cluster0.mongodb.net/smart_city?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_prod_2026
JWT_EXPIRES_IN=7d
JAVA_ENGINE_URL=https://scms-java-engine-production.up.railway.app/api/v1
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://smart-city-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://smart-city-backend.onrender.com
```
