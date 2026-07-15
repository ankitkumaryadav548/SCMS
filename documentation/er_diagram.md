# Entity Relationship (ER) Diagram

Below is the entity-relationship model of the Smart City Management System Database in Mermaid syntax.

```mermaid
erDiagram
    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password
        enum role "Citizen, Operator, Admin"
        timestamp created_at
        timestamp updated_at
    }

    TRAFFIC_SENSORS {
        int id PK
        varchar name
        decimal location_lat
        decimal location_lng
        enum status "Active, Maintenance, Inactive"
        int current_density
        decimal avg_speed
        timestamp last_updated
    }

    TRAFFIC_LOGS {
        int id PK
        int sensor_id FK
        int density
        decimal avg_speed
        timestamp logged_at
    }

    EMERGENCY_INCIDENTS {
        int id PK
        varchar title
        text description
        enum type "Fire, Accident, Flood, Power Outage, Medical"
        enum severity "Low, Medium, High, Critical"
        decimal location_lat
        decimal location_lng
        enum status "Reported, Dispatched, Resolved, Closed"
        int reported_by FK
        timestamp created_at
        timestamp updated_at
    }

    UTILITY_GRIDS {
        int id PK
        varchar name
        enum type "Electricity, Water, Gas"
        decimal capacity
        decimal current_load
        enum status "Normal, Overloaded, Outage, Maintenance"
        decimal location_lat
        decimal location_lng
        timestamp last_updated
    }

    NODE_LOGS {
        int id PK
        varchar module "Traffic, Utility, Emergency"
        varchar action
        json details
        timestamp created_at
    }

    USERS ||--o{ EMERGENCY_INCIDENTS : "reports"
    TRAFFIC_SENSORS ||--o{ TRAFFIC_LOGS : "logs history"
```

### Table Relationships and Cardinalities

1. **Users to Emergency Incidents (`one-to-many`)**: 
   - A registered citizen or operator (`USERS`) can submit zero, one, or multiple emergency reports (`EMERGENCY_INCIDENTS`). 
   - Each report is optionally associated with the reporter user's ID via the `reported_by` foreign key (which is set to null if the user account is deleted).

2. **Traffic Sensors to Traffic Logs (`one-to-many`)**:
   - A sensor (`TRAFFIC_SENSORS`) periodically registers speed and density metrics.
   - The metrics are stored in the historical `TRAFFIC_LOGS` table for analytics, forming a one-to-many relation mapped by `sensor_id`.

3. **Node Logs (`standalone`)**:
   - The `NODE_LOGS` table logs JSON actions taken by operators or the automated algorithm engines (shortest route paths, MST optimizations). It does not maintain strict FK relations to minimize lock contentions, serving as a high-speed write-heavy ledger.
