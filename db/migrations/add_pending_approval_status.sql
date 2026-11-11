-- Self-registered staff accounts start as PENDING_APPROVAL until an administrator activates them.
-- Run once on an EXISTING database (fresh installs get this from schema.sql):
--   mysql -u root -p mediqueue < db/migrations/add_pending_approval_status.sql
USE mediqueue;

ALTER TABLE users
    MODIFY account_status ENUM('ACTIVE','SUSPENDED','DEACTIVATED','PENDING_APPROVAL') DEFAULT 'ACTIVE';
