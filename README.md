# MediQueue — Online Appointment and Queue Management System

A web-based hospital system that streamlines doctor appointments, manages a virtual patient queue for each doctor, and keeps medical records, prescriptions, lab reports, bills and complaints in one place.

MediQueue gives every user a secure login, and the features they see depend on their role:

- **Patient** — searches for doctors, books time slots (with alternate slots suggested when the chosen one is unavailable), views appointments, bills and medical records, and raises complaints.
- **Doctor** — sees a dashboard and daily queue, views appointments, and issues digital prescriptions.
- **Lab Technician** — uploads diagnostic reports (PDF / images) against an appointment.
- **Receptionist** — views and filters all appointments, updates their status, and books appointments on behalf of walk-in or phone patients, including high-priority cases.
- **Administrator** — onboards and deactivates doctors, manages departments, views all users, and resolves patient complaints.

Doctor time slots are generated automatically: 5 one-hour slots per day (09:00, 10:00, 11:00, 14:00, 15:00) for every active doctor, for the next 7 days, refreshed daily at midnight. Bills are generated when an appointment is booked, using the Strategy pattern (standard, emergency and follow-up rates).

## Project structure

```
online-appointment-and-queue-management-system/
├── docker-compose.yml            # MySQL + backend + frontend containers
├── schema.sql                    # database schema (auto-loaded by the MySQL container)
├── .env.example                  # optional overrides for ports, passwords, JWT secret
├── .github/workflows/ci.yml      # GitHub Actions pipeline
├── mediqueue-backend/            # Spring Boot REST API
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/mediqueue/
│       │   ├── controller/       # REST endpoints (/api/v1/...)
│       │   ├── service/          # business logic (+ facade/ for notifications)
│       │   ├── repository/       # Spring Data JPA repositories
│       │   ├── entity/           # JPA entities and enums
│       │   ├── dto/              # request / response objects
│       │   ├── billing/          # billing strategies (Strategy pattern)
│       │   ├── factory/          # UserFactory (Factory pattern)
│       │   ├── scheduler/        # SlotScheduler — automatic time-slot generation
│       │   ├── security/         # JWT authentication filter and utilities
│       │   ├── config/           # security, CORS, demo data seeder
│       │   └── exception/        # custom exceptions and global handler
│       ├── main/resources/application.properties
│       └── test/java/com/mediqueue/   # JUnit 5 + Mockito tests
└── mediqueue-frontend/           # React single-page app
    ├── Dockerfile, nginx.conf    # production image (nginx serves the build and proxies /api)
    ├── cypress/                  # end-to-end tests
    └── src/
        ├── api/                  # Axios client and API helpers
        ├── components/           # layout and shared UI components
        ├── context/              # authentication context
        ├── pages/                # pages per role (patient, doctor, labtechnician, receptionist, admin)
        ├── routes/               # role-protected routing
        └── __tests__/            # Jest tests
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Java 17, Spring Boot 3.5 (Web, Data JPA, Security, Validation), JWT (jjwt 0.12), Maven |
| Database | MySQL 8 |
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Testing | JUnit 5, Mockito, Jest, React Testing Library, Cypress |
| DevOps | Docker, Docker Compose, Nginx, GitHub Actions |

## How to run

### Option 1 — Docker (recommended)

Requires Docker Desktop (running).

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api/v1 |
| MySQL | localhost:3306 |

To change ports, passwords or the JWT secret, copy `.env.example` to `.env` and edit it. If a local MySQL already uses port 3306, set `MYSQL_HOST_PORT` (e.g. `3307`) in `.env`.

To reset to an empty database: `docker compose down -v`.

### Option 2 — Run locally

Requires Java 17+, Maven, Node.js 20+ and MySQL 8.

1. Create the database:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Start the backend (defaults to MySQL user `root`, password `root@123`; override with `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`):
   ```bash
   cd mediqueue-backend
   mvn spring-boot:run
   ```
3. Start the frontend in another terminal:
   ```bash
   cd mediqueue-frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173 (the dev server proxies `/api` to the backend on port 8080).


### Demo accounts

On the first start against an empty database, demo data is created automatically: an administrator (`admin`), a receptionist (`reception`), a lab technician (`labtech`), a patient (`patient`), five departments, and ten doctors (`dr.mehta`, `dr.iyer`, `dr.rao`, `dr.khan`, `dr.nair`, `dr.das`, `dr.sharma`, `dr.reddy`, `dr.bose`, `dr.pillai`). The passwords are the `APP_SEED_ADMIN_PASSWORD` and `APP_SEED_DEFAULT_PASSWORD` values in `.env.example`. Set `APP_SEED_ENABLED=false` to turn this off.

### Running the tests

```bash
cd mediqueue-backend && mvn test           # backend unit tests
cd mediqueue-frontend && npm test          # frontend unit tests
cd mediqueue-frontend && npx cypress run   # end-to-end tests (app must be running)
```

## Limitations

The project is under active development. Known limitations at present:

- The doctor's virtual queue is not yet populated automatically, so the queue view and "In Queue" count stay empty; priority-based reordering is not active yet.
- Patients cannot yet reschedule appointments, cancel from their own page, view prescriptions, or download lab reports.
- Doctors cannot yet open a patient's medical history; medical records are not updated after a consultation.
- The lab technician upload page is not wired to the backend yet.
- Notifications (reminders, report-ready, prescription alerts) are only printed to the server log; no email or SMS is sent.
- Doctor search matches specialization only (not department, name or availability).
- Admin slot-duration settings, queue-priority override and the audit log are not implemented yet.
- Users created by the administrator and users who register themselves do not yet collect the same profile fields.
- Access control is role-based only; a user can request another user's records by changing the ID in the URL.
- Several Cypress tests are out of date with the current pages and fail.
