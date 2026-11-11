-- Virtual queue and clinical records. Run ONCE on a database created before this change
-- (after scheduling_and_booking.sql); fresh installs get all of this from schema.sql.
--   mysql -u root -p mediqueue < db/migrations/queue_and_clinical_records.sql
-- Docker: docker exec -i mediqueue-db mysql -uroot -proot mediqueue < db/migrations/queue_and_clinical_records.sql
USE mediqueue;

-- 1. Queue: when a patient was called in, and the administrator's position override.
ALTER TABLE virtual_queue
    ADD COLUMN called_at DATETIME NULL,
    ADD COLUMN override_position INT NULL;
CREATE INDEX idx_vq_doctor_date ON virtual_queue (doctor_id, queue_date);

-- 2. One medical record per patient (the backend also creates any missing ones at start-up).
INSERT INTO medical_records (patient_id)
SELECT p.user_id FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.user_id);

-- Queue entries for bookings made before the queue existed are added by the backend at start-up.
