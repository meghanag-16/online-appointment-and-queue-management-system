# MediQueue — Online Appointment and Queue Management System

A web-based hospital system that streamlines doctor appointments, manages a virtual patient queue for each doctor, and keeps medical records, prescriptions, lab reports, bills and complaints in one place.

MediQueue gives every user a secure login, and the features they see depend on their role:

- **Patient** — signs up, finds doctors by department, name/specialization and available day, books a time slot (with clickable alternate slots when the chosen one is taken), cancels or reschedules up to a cutoff before the visit, sees prescriptions as soon as they are issued, views and downloads lab reports, views bills and their medical record, raises complaints (optionally about an appointment or bill) and follows them until resolved, and gets notifications in the bell (booking, reminder, report ready, prescription, complaint updates).
- **Doctor** — runs a live daily queue (call next, start, finish, no-show), opens a patient's history (allergies, past diagnoses, prescriptions, visits) for patients on their own appointments, and issues digital prescriptions that complete the visit and update the patient's medical record.
- **Lab Technician** — finds an appointment by appointment ID, patient ID or name and uploads a report (PDF, PNG or JPEG, up to 10 MB); the patient is notified and can download it.
- **Receptionist** — views and filters all appointments, moves them through the allowed statuses, cancels or reschedules them, books on behalf of walk-in or phone patients (patient and doctor pickers), marks patients high priority, which reorders the doctor's queue at once, and collects payments on the Billing screen (mark paid with the method, failed, or refunded).
- **Administrator** — creates all doctor and staff accounts (with a generated temporary password the user must change at first login), resets passwords, activates, suspends or deactivates users, manages departments, sets the slot schedule (slot length, hours, break, working days, booking window, cancel cutoff), can override the order of any doctor's queue, reviews and resolves complaints (Open → Under review → Resolved, with a saved note), sends general alerts, and reads the audit log of key actions.

Every user has a **My Profile** page to edit their own details and change their password.

**Virtual queue.** Every booking joins the doctor's queue for that day. Appointment changes reach the queue through the Observer pattern (`event/AppointmentEventPublisher` notifies `QueueManager`), so booking, cancelling, rescheduling, status and priority changes all update it straight away. Order: patients already called or in consultation stay at the front; waiting patients go high priority first, then by slot time; an administrator override pins a waiting patient to a chosen position. Queue screens refresh every 5 seconds.

Doctor time slots are generated automatically for every active doctor from the administrator's **Slot Settings** (default: 30-minute slots, 09:00–17:00 with a 13:00–14:00 break, Monday–Saturday, 7 days ahead; patients may cancel or reschedule until 2 hours before). Slots are topped up at startup and every night, and regenerated when the settings change; booked appointments keep their time. All dates and times use the hospital time zone (Asia/Kolkata, set with `APP_TIMEZONE`).

**Billing.** A bill is created when an appointment is booked. The rate is chosen by the Strategy pattern (`billing/BillingStrategySelector`, stateless): **emergency** (150% of the fee) for high-priority visits, **follow-up** (50%) when the same doctor set a follow-up date at an earlier visit and this visit is no more than 7 days after it, **standard** (100%) otherwise. An unpaid bill is re-priced if the priority or time changes; when the visit is cancelled an unpaid bill becomes **Void** and a paid one **Refunded**.

**Notifications.** `service/facade/NotificationFacade` stores every notification (shown in each user's bell) with its delivery status, and hands it to a pluggable `NotificationSender`. The development sender writes to the server log; a real email/SMS provider can be added as another `NotificationSender` marked `@Primary`. Patients get one reminder about 24 hours before each booked or confirmed appointment (a job checks every 5 minutes; `APP_REMINDER_HOURS_BEFORE`, `APP_REMINDER_INTERVAL_MS`). Billing, notifications and the audit log follow appointment changes as further observers of `AppointmentEventPublisher`.

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
│       │   ├── scheduler/        # SlotScheduler (time slots) and ReminderScheduler (appointment reminders)
│       │   ├── audit/            # audit log of key actions
│       │   ├── lab/              # lab report file checks
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
| MySQL | localhost:3307 (inside Docker: mysql:3306) |

To change ports, passwords or the JWT secret, copy `.env.example` to `.env` and edit it. MySQL is published on host port 3307 so it does not clash with a local MySQL on 3306; change it with `MYSQL_HOST_PORT`. When deploying, add the site's address to `APP_CORS_ALLOWED_ORIGINS`.

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
mysql -u root -p mediqueue < db/migrations/lab_notifications_billing_admin.sql
```

Run them in that order; skip any you have already run. With Docker: `docker exec -i mediqueue-db mysql -uroot -proot mediqueue < db/migrations/<file>.sql` (or start fresh with `docker compose down -v`).

### Demo accounts

On the first start against an empty database, demo data is created automatically: an administrator (`admin`), a receptionist (`reception`), a lab technician (`labtech`), a patient (`patient`), five departments, and ten doctors (`dr.mehta`, `dr.iyer`, `dr.rao`, `dr.khan`, `dr.nair`, `dr.das`, `dr.sharma`, `dr.reddy`, `dr.bose`, `dr.pillai`). The passwords are the `APP_SEED_ADMIN_PASSWORD` and `APP_SEED_DEFAULT_PASSWORD` values in `.env.example`. Set `APP_SEED_ENABLED=false` to turn this off.

### Accounts and access

- Only **patients** can sign up (Register page); they are logged in straight away.
- Doctor, lab technician, receptionist and administrator accounts are created **only by an administrator** (Users page, or Doctors page for doctors). The administrator gets a one-time **temporary password** to hand over; at first login the user must choose their own password before anything else works. The administrator can issue a new temporary password with **Reset password**. Users change their details and password under **My Profile**.
- Patients see only their own data. Doctors see only patients on their own appointments. Lab technicians work with appointments and reports but cannot issue prescriptions. Receptionists and administrators can see everything.
- Uploaded lab report files are stored under `APP_UPLOAD_DIR` (default `uploads/`, a Docker volume in Compose) and can be downloaded only by the patient, their doctor, the lab, receptionists and administrators.
- Suspended or deactivated users are logged out on their next request. An expired login (after 24 hours) sends you back to the login page.

### Running the tests

```bash
cd mediqueue-backend && mvn test           # backend unit tests
cd mediqueue-frontend && npm test          # frontend unit tests
cd mediqueue-frontend && npx cypress run   # end-to-end tests (app must be running)
```

## API reference

All endpoints are under `/api/v1` and, except sign-up, login and the department list, need `Authorization: Bearer <token>`. Errors share one JSON shape: `{timestamp, status, error, path, fieldErrors?}` (plus `alternateSlots` on a 409 for a taken slot). Roles: P patient, D doctor, L lab technician, R receptionist, A administrator. "Own" means the server also checks the record belongs to the caller (a doctor: their own patients).

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| POST | `/auth/register` | public | Patient sign-up (logs in straight away) |
| POST | `/auth/login` | public | Log in; returns the JWT |
| GET / PUT | `/auth/me` | any | Read / edit own profile |
| PUT | `/auth/me/password` | any | Change own password |
| GET | `/departments` | public | Department list |
| GET | `/doctors/search?q=&departmentId=&date=` | P D R A | Find active doctors, with next open slot |
| GET | `/doctors/{id}/slots?date=` | P D R A | Open slots of a doctor |
| POST | `/appointments` | P R A | Book (patients always for themselves) |
| GET | `/appointments/{id}` | P D L R A | One appointment (own) |
| GET | `/appointments/patient/{id}` | P D R A | A patient's appointments (own) |
| GET | `/appointments/doctor/{id}` | D R A | A doctor's appointments (own) |
| GET | `/appointments/all?date=` | R A | All appointments |
| GET | `/appointments/stats` | R A | Front-desk counts for today |
| PATCH | `/appointments/{id}/cancel` | P R A | Cancel (patients: before the cutoff) |
| PATCH | `/appointments/{id}/reschedule` | P R A | Move to another slot of the same doctor |
| PATCH | `/appointments/{id}/status` | D R A | Status change following the allowed transitions |
| PATCH | `/appointments/{id}/priority` | R A | NORMAL / HIGH_PRIORITY (queue reorders) |
| GET | `/queue/doctor/{id}?date=` | D R A | A doctor's queue (own) |
| POST | `/queue/doctor/{id}/call-next` | D R A | Call the next waiting patient |
| POST | `/queue/entries/{id}/start` · `/finish` · `/no-show` | D R A | Run a visit |
| PATCH | `/queue/entries/{id}/position` | A | Pin a waiting patient to a position (null clears) |
| GET | `/doctor/dashboard/{id}` · `/doctor/queue/{id}` | D A | Doctor dashboard counts, queue |
| GET | `/patient/dashboard/{id}` | P A | Patient dashboard counts (own) |
| GET | `/patient/history/{id}` | P D R A | Full clinical history (own) |
| GET | `/patient/records/{id}` | P D A | Medical record (own) |
| GET | `/patient/search?q=` | R A | Find a patient to book for |
| POST | `/prescriptions` | D | Issue a prescription (treating doctor only) |
| GET | `/prescriptions/patient/{id}` · `/appointment/{id}` | P D R A | Prescriptions (own) |
| GET | `/prescriptions/doctor/{id}` | D A | A doctor's issued prescriptions (own) |
| GET | `/lab/appointments?q=` | L A | Find appointments for upload |
| POST | `/lab/upload` | L | Upload a report (multipart, PDF/PNG/JPEG, 10 MB) |
| GET | `/lab/appointment/{id}` · `/lab/patient/{id}` | P D L R A | Reports (own) |
| GET | `/lab/all` | L A | All reports |
| GET | `/lab/reports/{id}/download` | P D L R A | Download a report file (own) |
| GET | `/billing/patient/{id}` | P R A | A patient's bills (own) |
| GET | `/billing/appointment/{id}` | P D R A | Bill of an appointment (own) |
| GET | `/billing/all?status=&q=` | R A | Billing desk list |
| PATCH | `/billing/{id}/payment` | R A | Mark paid (with method), failed, refunded |
| POST | `/billing/generate/{appointmentId}?billingType=` | R A | Re-price an unpaid bill |
| POST | `/complaints` · GET `/complaints/mine` | P | Raise / list own complaints |
| GET | `/complaints/all?status=` | A | All complaints |
| PATCH | `/complaints/{id}/status` | A | Open → Under review → Resolved (note required) |
| GET | `/notifications/mine` | any | Own notifications and unread count |
| PATCH | `/notifications/{id}/read` · `/mine/read-all` | any | Mark read |
| POST | `/notifications/alert` · `/reminders/run` | A | Send an alert; send due reminders now |
| GET | `/settings/slots` | any | Slot settings and cancel cutoff |
| PUT | `/admin/settings/slots` | A | Change slot settings (open slots regenerated) |
| GET / POST | `/admin/doctors` | A | List / onboard doctors (temporary password) |
| PUT | `/admin/doctors/{id}` | A | Edit department, specialization, qualification, fee |
| PUT | `/admin/doctors/{id}/deactivate` | A | Deactivate (upcoming appointments are cancelled) |
| GET / POST | `/admin/departments` | A | List / add departments |
| GET | `/admin/dashboard` · `/admin/audit` | A | Admin counts; audit log |
| GET / POST | `/users` | A | List / create users of any role |
| GET | `/users/{id}` | A | A user's profile |
| PATCH | `/users/{id}/status` | A | ACTIVE / SUSPENDED / DEACTIVATED (inactive doctors' upcoming appointments are cancelled) |
| POST | `/users/{id}/reset-password` | A | New temporary password |

## Limitations

The project is under active development. Known limitations at present:

- Notifications are stored and shown in the app, but external delivery only writes to the server log; no email or SMS provider is connected yet.
- Payments are recorded by the front desk; there is no online payment.
- Several Cypress tests are out of date with the current pages and fail.
- Bookings from past days that nobody attended stay "Booked" until the front desk marks them No show; they are left out of the doctor's pending-prescription count.
