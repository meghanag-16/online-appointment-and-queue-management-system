# MediQueue — Online Appointment and Queue Management System

Hospital web app for booking doctor appointments, running a live queue per doctor, and keeping prescriptions, lab reports, bills and complaints in one place.

## Features by role

| Role | Can do |
|------|--------|
| Patient | Sign up, find doctors, book / cancel / reschedule, view prescriptions, lab reports, bills and medical record, raise complaints |
| Doctor | Run the daily queue, view patient history, issue prescriptions |
| Lab Technician | Find an appointment, upload reports (PDF / PNG / JPEG, max 10 MB) |
| Receptionist | Manage and book appointments, mark high priority, collect payments |
| Administrator | Manage users, doctors and departments, slot settings, queue override, complaints, alerts, audit log |

Every user has a **My Profile** page and gets in-app notifications.

## Key rules

- **Queue:** patients already called stay at the front; then high priority, then slot time. Screens refresh every 5 s.
- **Slots:** generated from admin Slot Settings (default 30 min, 09:00–17:00, Mon–Sat, 7 days ahead).
- **Cancel / reschedule:** patients up to 2 hours before the slot; staff any time before it.
- **Billing:** emergency 150% (high priority), follow-up 50%, standard 100%. Cancelled visits are voided or refunded.
- **Access:** patients see only their own data; doctors only their own patients.
- **Accounts:** only patients sign up. Staff accounts are created by the admin with a temporary password.
- **Time zone:** Asia/Kolkata (`APP_TIMEZONE`).

## Design patterns

| Pattern | Where |
|---------|-------|
| Factory | `factory/UserFactory` — creates the right user type per role |
| Strategy | `billing/` — pricing rules |
| Observer | `event/` — queue, billing, notifications and audit react to appointment changes |
| Facade | `service/facade/NotificationFacade` — stores and sends notifications |

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Java 17, Spring Boot 3.5, Spring Security + JWT, Maven |
| Database | MySQL 8 |
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Testing | JUnit 5, Mockito, Jest, React Testing Library, Cypress |
| DevOps | Docker Compose, Nginx, GitHub Actions |

## Project structure

```
├── docker-compose.yml     # MySQL + backend + frontend
├── schema.sql             # database schema
├── db/migrations/         # upgrades for older databases
├── mediqueue-backend/     # Spring Boot REST API (/api/v1)
└── mediqueue-frontend/    # React app
```

## Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:8080/api/v1
- MySQL: localhost:3307

Optional settings: copy `.env.example` to `.env`. Reset the database: `docker compose down -v`.

## Run locally

Needs Java 17+, Maven, Node.js 20+ and MySQL 8.

```bash
mysql -u root -p < schema.sql
cd mediqueue-backend && mvn spring-boot:run
cd mediqueue-frontend && npm install && npm run dev
```

Open http://localhost:5173. The backend uses MySQL user `root` / `root@123` by default (`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

## Upgrading an older database

Run once, in order, skipping any already applied:

```bash
mysql -u root -p mediqueue < db/migrations/scheduling_and_booking.sql
mysql -u root -p mediqueue < db/migrations/queue_and_clinical_records.sql
mysql -u root -p mediqueue < db/migrations/lab_notifications_billing_admin.sql
```

## Demo accounts

Created automatically on an empty database (`APP_SEED_ENABLED=false` turns this off).

| Username | Role |
|----------|------|
| `admin` | Administrator |
| `reception` | Receptionist |
| `labtech` | Lab Technician |
| `patient` | Patient |
| `dr.mehta`, `dr.iyer`, `dr.rao` … (10 doctors) | Doctor |

Passwords: `APP_SEED_ADMIN_PASSWORD` and `APP_SEED_DEFAULT_PASSWORD` in `.env.example`.

## Tests, linting and formatting

```bash
cd mediqueue-backend && mvn verify          # tests + format check + Checkstyle
cd mediqueue-backend && mvn spotless:apply  # format Java
cd mediqueue-frontend && npm test           # Jest tests
cd mediqueue-frontend && npm run lint       # ESLint
cd mediqueue-frontend && npm run format     # Prettier
```

CI runs all of these on every pull request.

## Limitations

- Email / SMS is not connected; notifications are in-app only.
- No online payment; the front desk records payments.
- Cypress tests are out of date.
