CREATE DATABASE IF NOT EXISTS mediqueue;
USE mediqueue;

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('PATIENT','DOCTOR','LAB_TECHNICIAN','RECEPTIONIST','ADMINISTRATOR'),
    account_status ENUM('ACTIVE','SUSPENDED','DEACTIVATED' ) DEFAULT 'ACTIVE'
);

CREATE TABLE patients (
    user_id             VARCHAR(50) PRIMARY KEY,
    blood_group         VARCHAR(5),
    allergies           TEXT,
    chronic_conditions  TEXT,
    emergency_contact   VARCHAR(150),
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE departments (
    department_id VARCHAR(50) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

CREATE TABLE doctors (
    user_id           VARCHAR(50) PRIMARY KEY,
    department_id     VARCHAR(50),
    qualification     VARCHAR(200),
    specialization    VARCHAR(100),
    consultation_fee  DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT fk_doctor_user   FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_dept   FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL
);

CREATE TABLE time_slots (
    slot_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id  VARCHAR(50)  NOT NULL,
    start_time DATETIME NOT NULL,
    end_time   DATETIME NOT NULL,
    status     ENUM('AVAILABLE','BOOKED','BLOCKED','CANCELLED')
                   NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_slot_doctor FOREIGN KEY (doctor_id)
        REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE TABLE appointments (
    appointment_id     BIGINT PRIMARY KEY,
    patient_id         VARCHAR(50)  NOT NULL,
    doctor_id          VARCHAR(50)  NOT NULL,
    slot_id            BIGINT,
    appointment_date   DATE,
    booking_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason_for_visit   TEXT,
    appointment_status ENUM('BOOKED','CONFIRMED','IN_PROGRESS',
                            'COMPLETED','CANCELLED','NO_SHOW')
                            DEFAULT 'BOOKED',
    priority           ENUM('NORMAL','HIGH_PRIORITY') DEFAULT 'NORMAL',
    created_by_role    ENUM('PATIENT','RECEPTIONIST') DEFAULT 'PATIENT',
    CONSTRAINT fk_appt_patient  FOREIGN KEY (patient_id)
        REFERENCES patients(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor   FOREIGN KEY (doctor_id)
        REFERENCES doctors(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_slot     FOREIGN KEY (slot_id)
        REFERENCES time_slots(slot_id) ON DELETE SET NULL
);

CREATE TABLE medical_records (
    record_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL UNIQUE,
    diagnoses  TEXT,
    observations TEXT,
    CONSTRAINT fk_mr_patient FOREIGN KEY (patient_id)
        REFERENCES patients(user_id) ON DELETE CASCADE
);

CREATE TABLE prescriptions (
    prescription_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id   BIGINT NOT NULL UNIQUE,
    diagnosis_notes  TEXT,
    medication_list  TEXT,
    advice           TEXT,
    follow_up_date   DATE,
    issued_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

CREATE TABLE lab_reports (
    report_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT       NOT NULL,
    report_type     VARCHAR(100),
    upload_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    file_path       VARCHAR(500),
    remarks         TEXT,
    CONSTRAINT fk_lr_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

CREATE TABLE bills (
    bill_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT UNIQUE,
    total_amount    DECIMAL(10,2)  DEFAULT 0.00,
    payment_status  ENUM('PENDING','PAID','FAILED','REFUNDED') DEFAULT 'PENDING',
    payment_method  VARCHAR(50),
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

CREATE TABLE complaints (
    complaint_id       VARCHAR(50) PRIMARY KEY,
    patient_id         VARCHAR(50) NOT NULL,
    issue_type         VARCHAR(100),
    description        TEXT,
    created_on         DATE    DEFAULT (CURRENT_DATE),
    resolution_status  ENUM('OPEN','UNDER_REVIEW','RESOLVED') DEFAULT 'OPEN',
    CONSTRAINT fk_comp_patient FOREIGN KEY (patient_id)
        REFERENCES patients(user_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id  BIGINT PRIMARY KEY,
    recipient_id     VARCHAR(50)  NOT NULL,
    type             ENUM('APPOINTMENT_REMINDER','REPORT_READY',
                          'PRESCRIPTION_AVAILABLE','GENERAL_ALERT'),
    message          TEXT,
    timestamp        DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_status  ENUM('SENT','FAILED','PENDING') DEFAULT 'PENDING',
    CONSTRAINT fk_notif_user FOREIGN KEY (recipient_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE virtual_queue (
    queue_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       VARCHAR(50) ,
    appointment_id  BIGINT  UNIQUE,
    queue_date      DATE,
    queue_position  INT,
    visit_status    ENUM('WAITING','CALLED','IN_CONSULTATION','FINISHED') DEFAULT 'WAITING',
    CONSTRAINT fk_vq_doctor FOREIGN KEY (doctor_id)
        REFERENCES doctors(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_vq_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id) ON DELETE CASCADE
);


-- Sub-tables for joined inheritance (created by Hibernate on ddl-auto=update; listed here for reference)
CREATE TABLE IF NOT EXISTS lab_technicians (user_id VARCHAR(50) PRIMARY KEY, CONSTRAINT fk_lt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS receptionists    (user_id VARCHAR(50) PRIMARY KEY, CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS administrators   (user_id VARCHAR(50) PRIMARY KEY, CONSTRAINT fk_adm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE);
