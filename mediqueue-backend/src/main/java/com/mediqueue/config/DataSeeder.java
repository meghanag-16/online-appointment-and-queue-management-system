package com.mediqueue.config;

import com.mediqueue.entity.*;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.factory.UserFactory;
import com.mediqueue.repository.DepartmentRepository;
import com.mediqueue.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DataSeeder — creates demo data on a FRESH database only (users table empty), so a new install can
 * be logged into and demoed immediately: one administrator, departments, doctors (two per
 * department so same-department alternate suggestions can be shown), a receptionist, a lab
 * technician and a patient.
 *
 * <p>It never modifies or deletes existing rows. Users are built through {@link UserFactory}, the
 * same creational path used by registration, so seeded users match real ones. Time slots for the
 * seeded doctors are generated afterwards by SlotScheduler/SlotService (it runs on
 * ApplicationReadyEvent, which fires after all ApplicationRunners).
 */
@Component
@Order(1)
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final UserFactory userFactory;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean enabled;

    @Value("${app.seed.admin-password:Admin@123}")
    private String adminPassword;

    @Value("${app.seed.default-password:Welcome@123}")
    private String defaultPassword;

    public DataSeeder(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            UserFactory userFactory,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.userFactory = userFactory;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("[DataSeeder] Seeding disabled (app.seed.enabled=false)");
            return;
        }
        if (userRepository.count() > 0) {
            log.info("[DataSeeder] Users already exist — skipping demo seed");
            return;
        }

        log.info("[DataSeeder] Fresh database detected — creating demo data");

        // ── Departments ──────────────────────────────────────────────────────
        Map<String, Department> departments = new LinkedHashMap<>();
        departments.put("CARDIOLOGY", department("DEPT-CARD", "Cardiology"));
        departments.put("ORTHOPEDICS", department("DEPT-ORTH", "Orthopedics"));
        departments.put("PEDIATRICS", department("DEPT-PEDS", "Pediatrics"));
        departments.put("GENERAL", department("DEPT-GENM", "General Medicine"));
        departments.put("DERMATOLOGY", department("DEPT-DERM", "Dermatology"));

        // ── Administrator ────────────────────────────────────────────────────
        User admin =
                userFactory.createUser(
                        UserRole.ADMINISTRATOR,
                        "System Administrator",
                        "admin",
                        "admin@mediqueue.test",
                        passwordEncoder.encode(adminPassword));
        contact(admin, "9000000001", "OTHER", LocalDate.of(1985, 1, 1));
        userRepository.save(admin);

        // ── Doctors (2 per department) ───────────────────────────────────────
        doctor(
                "dr.mehta",
                "Dr. Arjun Mehta",
                departments.get("CARDIOLOGY"),
                "Cardiologist",
                "MBBS, MD, DM (Cardiology)",
                "800");
        doctor(
                "dr.iyer",
                "Dr. Kavya Iyer",
                departments.get("CARDIOLOGY"),
                "Interventional Cardiologist",
                "MBBS, MD, DM",
                "900");
        doctor(
                "dr.rao",
                "Dr. Suresh Rao",
                departments.get("ORTHOPEDICS"),
                "Orthopedic Surgeon",
                "MBBS, MS (Ortho)",
                "700");
        doctor(
                "dr.khan",
                "Dr. Ayesha Khan",
                departments.get("ORTHOPEDICS"),
                "Sports Medicine",
                "MBBS, MS (Ortho)",
                "650");
        doctor(
                "dr.nair",
                "Dr. Priya Nair",
                departments.get("PEDIATRICS"),
                "Pediatrician",
                "MBBS, MD (Pediatrics)",
                "500");
        doctor(
                "dr.das",
                "Dr. Rohan Das",
                departments.get("PEDIATRICS"),
                "Neonatologist",
                "MBBS, MD, DM",
                "600");
        doctor(
                "dr.sharma",
                "Dr. Neha Sharma",
                departments.get("GENERAL"),
                "General Physician",
                "MBBS, MD (Medicine)",
                "400");
        doctor(
                "dr.reddy",
                "Dr. Vikram Reddy",
                departments.get("GENERAL"),
                "Internal Medicine",
                "MBBS, MD (Medicine)",
                "450");
        doctor(
                "dr.bose",
                "Dr. Ananya Bose",
                departments.get("DERMATOLOGY"),
                "Dermatologist",
                "MBBS, MD (Dermatology)",
                "550");
        doctor(
                "dr.pillai",
                "Dr. Karthik Pillai",
                departments.get("DERMATOLOGY"),
                "Cosmetic Dermatology",
                "MBBS, DVD",
                "600");

        // ── Front desk & lab staff ───────────────────────────────────────────
        User receptionist =
                userFactory.createUser(
                        UserRole.RECEPTIONIST,
                        "Ritu Verma",
                        "reception",
                        "reception@mediqueue.test",
                        passwordEncoder.encode(defaultPassword));
        contact(receptionist, "9000000002", "FEMALE", LocalDate.of(1993, 6, 15));
        userRepository.save(receptionist);

        User labTech =
                userFactory.createUser(
                        UserRole.LAB_TECHNICIAN,
                        "Manoj Kumar",
                        "labtech",
                        "lab@mediqueue.test",
                        passwordEncoder.encode(defaultPassword));
        contact(labTech, "9000000003", "MALE", LocalDate.of(1990, 3, 22));
        userRepository.save(labTech);

        // ── Patient ──────────────────────────────────────────────────────────
        Patient patient =
                (Patient)
                        userFactory.createUser(
                                UserRole.PATIENT,
                                "Riya Nair",
                                "patient",
                                "patient@mediqueue.test",
                                passwordEncoder.encode(defaultPassword));
        contact(patient, "9000000004", "FEMALE", LocalDate.of(1998, 9, 10));
        patient.setBloodGroup("B+");
        patient.setAllergies("Penicillin");
        patient.setChronicConditions("None");
        patient.setEmergencyContact("Anil Nair — 9000000099");
        userRepository.save(patient);

        log.info(
                "[DataSeeder] Demo data created: {} departments, 10 doctors, admin, receptionist, "
                        + "lab technician, patient. Usernames: admin, reception, labtech, patient, dr.mehta … "
                        + "(passwords: app.seed.admin-password / app.seed.default-password)",
                departments.size());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Department department(String id, String name) {
        return departmentRepository.save(new Department(id, name));
    }

    private void doctor(
            String username,
            String name,
            Department dept,
            String specialization,
            String qualification,
            String fee) {
        Doctor d =
                (Doctor)
                        userFactory.createUser(
                                UserRole.DOCTOR,
                                name,
                                username,
                                username.replace("dr.", "") + ".doctor@mediqueue.test",
                                passwordEncoder.encode(defaultPassword));
        contact(
                d,
                "98" + String.format("%08d", Math.abs(username.hashCode()) % 100_000_000),
                null,
                null);
        d.setDepartment(dept);
        d.setSpecialization(specialization);
        d.setQualification(qualification);
        d.setConsultationFee(new BigDecimal(fee));
        userRepository.save(d);
    }

    private void contact(User u, String phone, String gender, LocalDate dob) {
        u.setPhoneNumber(phone);
        u.setGender(gender);
        u.setDateOfBirth(dob);
    }
}
