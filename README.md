# MediQueue — Online Appointment and Queue Management System

A web-based hospital system that streamlines doctor appointments, manages a virtual patient queue for each doctor, and keeps medical records, prescriptions, lab reports, bills and complaints in one place.

MediQueue gives every user a secure login, and the features they see depend on their role:

- **Patient** — signs up, finds doctors by department, name/specialization and available day, books a time slot (with clickable alternate slots when the chosen one is taken), cancels or reschedules up to a cutoff before the visit, sees prescriptions as soon as they are issued, views bills and their medical record, and raises complaints.
- **Doctor** — runs a live daily queue (call next, start, finish, no-show), opens a patient's history (allergies, past diagnoses, prescriptions, visits) for patients on their own appointments, and issues digital prescriptions that complete the visit and update the patient's medical record.
- **Lab Technician** — uploads diagnostic reports (PDF / images) against an appointment.
- **Receptionist** — views and filters all appointments, moves them through the allowed statuses, cancels or reschedules them, books on behalf of walk-in or phone patients (patient and doctor pickers), and marks patients high priority, which reorders the doctor's queue at once.
- **Administrator** — creates all doctor and staff accounts, deactivates users, manages departments, sets the slot schedule (slot length, hours, break, working days, booking window, cancel cutoff), can override the order of any doctor's queue, and resolves patient complaints.

Every user has a **My Profile** page to edit their own details and change their password.

**Virtual queue.** Every booking joins the doctor's queue for that day. Appointment changes reach the queue through the Observer pattern (`event/AppointmentEventPublisher` notifies `QueueManager`), so booking, cancelling, rescheduling, status and priority changes all update it straight away. Order: patients already called or in consultation stay at the front; waiting patients go high priority first, then by slot time; an administrator override pins a waiting patient to a chosen position. Queue screens refresh every 5 seconds.

Doctor time slots are generated automatically for every active doctor from the administrator's **Slot Settings** (default: 30-minute slots, 09:00–17:00 with a 13:00–14:00 break, Monday–Saturday, 7 days ahead; patients may cancel or reschedule until 2 hours before). Slots are topped up at startup and every night, and regenerated when the settings change; booked appointments keep their time. All dates and times use the hospital time zone (Asia/Kolkata, set with `APP_TIMEZONE`). Bills are generated when an appointment is booked, using the Strategy pattern (standard, emergency and follow-up rates).

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

### Upgrading an existing database

Fresh databases get everything from `schema.sql`. If your database was created earlier, run the files in `db/migrations/` once:

```bash
mysql -u root -p mediqueue < db/migrations/scheduling_and_booking.sql
mysql -u root -p mediqueue < db/migrations/queue_and_clinical_records.sql
```

Run them in that order; skip any you have already run. With Docker: `docker exec -i mediqueue-db mysql -uroot -proot mediqueue < db/migrations/<file>.sql` (or start fresh with `docker compose down -v`).

### Demo accounts

On the first start against an empty database, demo data is created automatically: an administrator (`admin`), a receptionist (`reception`), a lab technician (`labtech`), a patient (`patient`), five departments, and ten doctors (`dr.mehta`, `dr.iyer`, `dr.rao`, `dr.khan`, `dr.nair`, `dr.das`, `dr.sharma`, `dr.reddy`, `dr.bose`, `dr.pillai`). The passwords are the `APP_SEED_ADMIN_PASSWORD` and `APP_SEED_DEFAULT_PASSWORD` values in `.env.example`. Set `APP_SEED_ENABLED=false` to turn this off.

### Accounts and access

- Only **patients** can sign up (Register page); they are logged in straight away.
- Doctor, lab technician, receptionist and administrator accounts are created **only by an administrator** (Users page, or Doctors page for doctors). They sign in with the username and initial password the administrator gives them, and can change their details and password under **My Profile**.
- Patients see only their own data. Doctors see only patients on their own appointments. Lab technicians work with appointments and reports but cannot issue prescriptions. Receptionists and administrators can see everything.
- Suspended or deactivated users are logged out on their next request. An expired login (after 24 hours) sends you back to the login page.

### Running the tests

```bash
cd mediqueue-backend && mvn test           # backend unit tests
cd mediqueue-frontend && npm test          # frontend unit tests
cd mediqueue-frontend && npx cypress run   # end-to-end tests (app must be running)
```

## Limitations

The project is under active development. Known limitations at present:

- Patients cannot yet download lab reports.
- Cancelled appointments keep a pending bill (refunds come with the billing rework).
- Lab technicians can upload reports, but there is no download link yet, and file types are not restricted to PDF and images.
- Notifications (reminders, report-ready, prescription alerts) are only printed to the server log; they are not stored or sent by email/SMS yet.
- The audit log is not implemented yet.
- Several Cypress tests are out of date with the current pages and fail.
