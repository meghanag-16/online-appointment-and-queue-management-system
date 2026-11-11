-- Lab reports, notifications, billing, complaints, temporary passwords and the audit log.
-- Run ONCE on a database created before this change (after queue_and_clinical_records.sql);
-- fresh installs get all of this from the Flyway migrations (mediqueue-backend/src/main/resources/db/migration).
--   mysql -u root -p mediqueue < db/migrations/lab_notifications_billing_admin.sql
-- Docker: docker exec -i mediqueue-db mysql -uroot -proot mediqueue < db/migrations/lab_notifications_billing_admin.sql
USE mediqueue;

-- 1. Accounts created by the administrator get a temporary password that must be changed at first login.
ALTER TABLE users
    ADD COLUMN must_change_password BIT(1) NOT NULL DEFAULT b'0';

-- 2. Notifications: auto-increment IDs, read flag, the appointment they are about, and the channel used.
ALTER TABLE notifications
    MODIFY notification_id BIGINT NOT NULL AUTO_INCREMENT,
    ADD COLUMN is_read BIT(1) NOT NULL DEFAULT b'0',
    ADD COLUMN appointment_id BIGINT NULL,
    ADD COLUMN channel VARCHAR(20) NULL,
    ADD INDEX idx_notif_recipient_time (recipient_id, timestamp),
    ADD INDEX idx_notif_appointment_type (appointment_id, type);

-- 3. Lab reports: the test name (report_type), the original file name, its type and size, and who uploaded it.
ALTER TABLE lab_reports
    ADD COLUMN original_file_name VARCHAR(255) NULL,
    ADD COLUMN content_type VARCHAR(100) NULL,
    ADD COLUMN file_size BIGINT NULL,
    ADD COLUMN uploaded_by VARCHAR(50) NULL;
-- report_type used to hold the file's content type; move it across and use a neutral test name.
UPDATE lab_reports SET content_type = report_type, report_type = 'Lab report'
WHERE report_type LIKE '%/%';

-- 4. Bills: which pricing rule was used, when it was paid, and VOID for unpaid bills of cancelled visits.
ALTER TABLE bills
    MODIFY payment_status ENUM('PENDING','PAID','FAILED','REFUNDED','VOID') DEFAULT 'PENDING',
    ADD COLUMN billing_type ENUM('STANDARD','EMERGENCY','FOLLOW_UP') NOT NULL DEFAULT 'STANDARD',
    ADD COLUMN paid_at DATETIME NULL;
-- Bills of appointments that were already cancelled: unpaid ones are voided, paid ones refunded.
UPDATE bills b JOIN appointments a ON a.appointment_id = b.appointment_id
SET b.payment_status = 'VOID'
WHERE a.appointment_status = 'CANCELLED' AND b.payment_status IN ('PENDING','FAILED');
UPDATE bills b JOIN appointments a ON a.appointment_id = b.appointment_id
SET b.payment_status = 'REFUNDED'
WHERE a.appointment_status = 'CANCELLED' AND b.payment_status = 'PAID';

-- 5. Complaints: optional link to an appointment or a bill, and the saved resolution note.
ALTER TABLE complaints
    ADD COLUMN appointment_id BIGINT NULL,
    ADD COLUMN bill_id BIGINT NULL,
    ADD COLUMN resolution_note TEXT NULL,
    ADD COLUMN updated_at DATETIME NULL,
    ADD COLUMN resolved_at DATETIME NULL,
    ADD CONSTRAINT fk_comp_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_comp_bill FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id) ON DELETE SET NULL;

-- 6. Audit log of key actions (kept even if the user who did it is later removed).
CREATE TABLE audit_log (
    audit_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at   DATETIME     NOT NULL,
    actor_id     VARCHAR(50)  NULL,
    actor_name   VARCHAR(100) NULL,
    actor_role   VARCHAR(30)  NULL,
    action       VARCHAR(50)  NOT NULL,
    target_type  VARCHAR(50)  NULL,
    target_id    VARCHAR(50)  NULL,
    details      TEXT         NULL,
    INDEX idx_audit_time (created_at),
    INDEX idx_audit_action (action)
);
