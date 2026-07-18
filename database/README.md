# Smart City Management System - MongoDB Database Specification

This project utilizes **MongoDB NoSQL Database** with **Mongoose ORM** for high performance, flexible schema validation, and dynamic geospatial indexing.

---

## 🗄️ Database Connection
- **Default Database URI**: `mongodb://localhost:27017/smart_city`
- **Configuration**: Defined in [`backend/src/config/db.js`](file:///d:/desktop/DSA_Project/backend/src/config/db.js)
- **Auto-Seeding**: Automated initial data population via [`backend/src/config/seedMongo.js`](file:///d:/desktop/DSA_Project/backend/src/config/seedMongo.js)

---

## 📋 Collections & Schema Summary

### 1. `users` Collection
Stores administrative and citizen user credentials and role-based permissions.
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique)
- `password`: String (Bcrypt Hash)
- `role`: Enum (`'Admin'`, `'Operator'`, `'Citizen'`, `'Visitor'`)
- `resetPasswordToken`: String
- `resetPasswordExpires`: Date
- `created_at`: Date

### 2. `bookings` Collection
Tracks parking slot reservations, municipal service requests, and FIFO waiting queue items.
- `_id`: ObjectId
- `userId`: Ref(`User`)
- `userName`: String
- `userEmail`: String
- `type`: Enum (`'Parking'`, `'City Service'`, `'Waiting Queue'`)
- `serviceDetails`: Object (`{ name, location, vehicleNumber, scheduledDate, notes }`)
- `status`: Enum (`'Pending'`, `'Approved'`, `'Rejected'`, `'Cancelled'`)
- `queuePosition`: Number
- `adminNote`: String
- `created_at`: Date

### 3. `parkingslots` Collection
Tracks physical smart parking slots and availability in city zones.
- `_id`: ObjectId
- `slotNumber`: String (Unique, e.g. `'A-01'`)
- `zone`: Enum (`'A'`, `'B'`, `'C'`, `'D'`)
- `location`: String
- `status`: Enum (`'Available'`, `'Reserved'`, `'Occupied'`)
- `pricePerHour`: Number
- `vehicleNumber`: String
- `reservedBy`: Ref(`User`)

### 4. `emergencyincidents` Collection
Tracks active hazards and priority emergency vehicle dispatches.
- `_id`: ObjectId
- `title`: String
- `description`: String
- `type`: Enum (`'Fire'`, `'Accident'`, `'Flood'`, `'Power Outage'`, `'Medical'`)
- `severity`: Enum (`'Low'`, `'Medium'`, `'High'`, `'Critical'`)
- `location_lat`: Number
- `location_lng`: Number
- `status`: Enum (`'Reported'`, `'Dispatched'`, `'Resolved'`, `'Closed'`)
- `reported_by`: Ref(`User`)

### 5. `citizens` Collection
Citizen directory profiles, IDs, tax status, and residency details.
- `_id`: ObjectId
- `citizen_id`: String (Unique)
- `full_name`: String
- `email`: String
- `phone`: String
- `ward_number`: Number
- `tax_status`: Enum (`'Clear'`, `'Pending'`, `'Overdue'`)

### 6. `departments` Collection
Municipal city department resource allocation and staff teams.
- `_id`: ObjectId
- `dept_id`: String (Unique)
- `name`: String
- `head`: String
- `budget`: Number
- `staff_count`: Number

---

## 🚀 How to Run MongoDB Database Setup
1. Ensure MongoDB Community Server or MongoDB Service is running locally on port `27017`.
2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
3. The system will automatically connect to MongoDB and auto-seed initial collections upon first launch.
