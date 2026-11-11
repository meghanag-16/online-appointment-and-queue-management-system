-- patient-only sign-up, scheduling and booking. Run ONCE on a database created
-- before this change; fresh installs get all of this from schema.sql.
--   mysql -u root -p mediqueue < db/migrations/scheduling_and_booking.sql
-- Docker: docker exec -i mediqueue-db mysql -uroot -proot mediqueue < db/migrations/scheduling_and_booking.sql
USE mediqueue;

-- 1. No more staff self-registration, so no "pending approval" state. Any staff sign-up that was
--    never approved stays locked out (DEACTIVATED); an administrator can activate it if wanted.
UPDATE users SET account_status = 'DEACTIVATED' WHERE account_status = 'PENDING_APPROVAL';
ALTER TABLE users
    MODIFY account_status ENUM('ACTIVE','SUSPENDED','DEACTIVATED') DEFAULT 'ACTIVE';

-- 2. Appointment IDs become auto-increment (they were timestamp + random and could collide).
--    Foreign key checks are paused because bills, prescriptions, lab reports and the queue point here.
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE appointments MODIFY appointment_id BIGINT NOT NULL AUTO_INCREMENT;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Administrator slot settings (the backend fills in the defaults on first start).
CREATE TABLE IF NOT EXISTS slot_settings (
    settings_id          INT PRIMARY KEY,
    slot_minutes         INT          NOT NULL DEFAULT 30,
    day_start            TIME         NOT NULL DEFAULT '09:00:00',
    day_end              TIME         NOT NULL DEFAULT '17:00:00',
    break_start          TIME         NULL     DEFAULT '13:00:00',
    break_end            TIME         NULL     DEFAULT '14:00:00',
    working_days         VARCHAR(80)  NOT NULL DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY',
    booking_window_days  INT          NOT NULL DEFAULT 7,
    change_cutoff_hours  INT          NOT NULL DEFAULT 2,
    updated_at           DATETIME
);

-- 4. Indexes for slot look-ups (doctor's slots by time, open slots by time).
CREATE INDEX idx_slot_doctor_start ON time_slots (doctor_id, start_time);
CREATE INDEX idx_slot_status_start ON time_slots (status, start_time);
