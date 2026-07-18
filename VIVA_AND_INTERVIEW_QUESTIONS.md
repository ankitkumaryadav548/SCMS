# 🎓 Top Viva & Technical Interview Questions - SCMS

This guide covers the top questions, technical explanations, and sample answers you need to ace your **project viva**, **practical examination**, or **software engineering interview**.

---

## 🧠 Part 1: Core Architecture & System Design

### Q1: Explain the high-level architecture of your project.
> **Answer**: The Smart City Management System uses a decoupled 3-tier micro-architecture:
> 1. **Frontend**: React 18 + Vite SPA for user interaction and live map visualization.
> 2. **Backend API**: Node.js Express server handling authentication, Socket.io WebSockets, MongoDB data management, and proxy routing.
> 3. **Algorithm Engine**: Java Spring Boot microservice running heavy graph algorithms (Dijkstra, A*, Kruskal's MST).
> 4. **Database**: MongoDB NoSQL database storing user profiles, bookings, incidents, and sensors.

### Q2: Why did you separate Node.js and Java Spring Boot instead of putting everything in one server?
> **Answer**: Separation of Concerns (Decoupled Microservices):
> - **Node.js** excels at I/O-bound tasks, real-time WebSocket broadcasting, and REST API handling.
> - **Java Spring Boot** excels at CPU-intensive computation and heavy Data Structures & Algorithms. Separating them ensures that heavy routing calculations do not freeze web API response times.

---

## ⚡ Part 2: Data Structures & Algorithms (DSA)

### Q3: What is the difference between Dijkstra's algorithm and A* algorithm in your project?
> **Answer**:
> - **Dijkstra's Algorithm**: Calculates the absolute shortest path from a source node to all other nodes by exploring in all directions based purely on cumulative edge weights. Time complexity: $O((V+E)\log V)$.
> - **A\* Pathfinder**: Enhances Dijkstra by incorporating a **Heuristic Function $h(n)$** (in our case, Haversine geographic distance in km to the target). It directs the search towards the destination faster, visiting fewer nodes. Evaluation function: $f(n) = g(n) + h(n)$.

### Q4: How does the FIFO Queue work in Booking Management?
> **Answer**:
> - The waiting queue is implemented as a First-In, First-Out (FIFO) queue data structure.
> - When a citizen submits a request, it is **enqueued** ($O(1)$) to the back of the queue with an incremental position number (`Queue #1`, `#2`...).
> - When an admin approves or rejects the request at the front of the line, it is **dequeued** ($O(1)$ / $O(N)$), and remaining queue position numbers are dynamically updated.

### Q5: How does Kruskal's algorithm optimize the Utility Grid layout?
> **Answer**:
> - Kruskal's algorithm finds the **Minimum Spanning Tree (MST)** of a connected weighted graph.
> - It sorts all candidate power/water line connections by length in ascending order ($O(E \log E)$).
> - Using a **Disjoint Set Union (Union-Find)** data structure with Path Compression, it greedily adds edges that connect separate components without introducing closed cycles, ensuring minimum total infrastructure cost.

---

## 🚦 Part 3: Real-Time Traffic & WebSockets

### Q6: How does real-time traffic updates work without refreshing the page?
> **Answer**:
> - We use **Socket.io (WebSockets)** over an open TCP connection.
> - The backend `trafficSimulator.js` runs a 2-second simulation tick. Every tick, it calculates updated traffic density and speed metrics and broadcasts a `traffic_update` event to all connected React clients.
> - The React client listens for this event and updates Leaflet map polyline colors dynamically.

### Q7: How does emergency vehicle priority routing work?
> **Answer**:
> - When an emergency vehicle (e.g. `FIRE-07`) is dispatched, the simulator builds a priority graph where emergency speed limits are higher.
> - The Java Engine computes Dijkstra's fastest route for `FIRE-07`.
> - To reroute civilian traffic away from `FIRE-07`'s route, the system penalizes primary route edges ($3\times$ weight) and runs Dijkstra again to generate a secondary **alternative path** for civilian traffic.

---

## 🗄️ Part 4: Database & Security

### Q8: Why did you choose MongoDB over MySQL?
> **Answer**:
> - **Schema Flexibility**: Smart city entities (like booking details or incident parameters) vary dynamically by service type. MongoDB's BSON documents handle flexible nested objects cleanly.
> - **Performance**: High-throughput read/write performance for rapid traffic log insertions and real-time state lookups.

### Q9: How is user authentication secured in your project?
> **Answer**:
> - Passwords are hashed using **Bcrypt** with a salt round of 10 prior to database insertion.
> - Authentication uses stateless **JSON Web Tokens (JWT)** signed with a secret key. Protected endpoints enforce Role-Based Access Control (RBAC) via middleware to restrict Admin routes (`/dashboard`, `/citizens`, `/emergency`) from unauthorized standard users.
