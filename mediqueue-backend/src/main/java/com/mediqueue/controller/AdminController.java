package com.mediqueue.controller;

import com.mediqueue.entity.Department;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.DepartmentRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(DoctorRepository doctorRepository,
                          DepartmentRepository departmentRepository,
                          UserRepository userRepository,
                          AppointmentRepository appointmentRepository,
                          ComplaintRepository complaintRepository,
                          PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Doctors endpoints
    @GetMapping("/doctors")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Map<String, Object>>> getAllDoctors() {
        List<Doctor> doctors = doctorRepository.findAll();
        if (!doctors.isEmpty()) {
            List<Map<String, Object>> response = doctors.stream().map(doc -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", doc.getUserId());
                item.put("userId", doc.getUserId());
                item.put("name", doc.getName());
                item.put("username", doc.getUsername());
                item.put("email", doc.getEmail());
                item.put("specialization", doc.getSpecialization());
                item.put("qualification", doc.getQualification());
                item.put("consultationFee", doc.getConsultationFee());
                item.put("accountStatus", doc.getAccountStatus());
                return item;
            }).toList();
            return ResponseEntity.ok(response);
        }

        List<Map<String, Object>> fallback = userRepository.findAllDoctorUsersRaw().stream().map(row -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", row[0]);
            item.put("userId", row[0]);
            item.put("name", row[1]);
            item.put("username", row[2]);
            item.put("email", row[3]);
            item.put("specialization", "Doctor");
            item.put("accountStatus", row[5]);
            return item;
        }).toList();
        return ResponseEntity.ok(fallback);
    }

    @PostMapping("/doctors")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> onboardDoctor(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String email = request.get("email");
            String specialization = request.get("specialization");
            String qualification = request.get("qualification");
            String consultationFeeStr = request.get("consultationFee");

            if (name == null || email == null || specialization == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Name, email, and specialization are required"));
            }

            // Generate unique username
            String baseUsername = name.toLowerCase().replace(" ", ".");
            String username = baseUsername;
            int counter = 1;
            
            // Check if username already exists, if so append counter
            while (userRepository.findByUsername(username).isPresent()) {
                username = baseUsername + counter;
                counter++;
            }

            // Create doctor (extends User)
            String userId = "DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Doctor doctor = new Doctor();
            doctor.setUserId(userId);
            doctor.setName(name);
            doctor.setEmail(email);
            doctor.setUsername(username);
            doctor.setPassword(passwordEncoder.encode("default123"));
            doctor.setRole(UserRole.DOCTOR);
            doctor.setAccountStatus(AccountStatus.ACTIVE);
            doctor.setSpecialization(specialization);
            doctor.setQualification(qualification);
            if (consultationFeeStr != null && !consultationFeeStr.isBlank()) {
                try {
                    doctor.setConsultationFee(new java.math.BigDecimal(consultationFeeStr));
                } catch (NumberFormatException ignored) {}
            }
            
            Doctor saved = doctorRepository.save(doctor);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/doctors/{doctorId}/deactivate")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Void> deactivateDoctor(@PathVariable String doctorId) {
        try {
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                doctor.setAccountStatus(AccountStatus.DEACTIVATED);
                doctorRepository.save(doctor);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // Departments endpoints
    @GetMapping("/departments")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Department> addDepartment(@RequestBody Map<String, String> request) {
        try {
            String deptId = "DEPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Department dept = new Department();
            dept.setDepartmentId(deptId);
            dept.setDepartmentName(request.get("departmentName"));
            return ResponseEntity.status(HttpStatus.CREATED).body(departmentRepository.save(dept));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        long totalUsers = userRepository.count();
        long totalDoctors = doctorRepository.count();
        long activeAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getAppointmentStatus() == AppointmentStatus.BOOKED)
                .count();
        long openComplaints = complaintRepository.findAll().stream()
                .filter(c -> c.getResolutionStatus() == ResolutionStatus.OPEN)
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers", totalUsers);
        summary.put("totalDoctors", totalDoctors);
        summary.put("activeAppointments", activeAppointments);
        summary.put("openComplaints", openComplaints);
        return ResponseEntity.ok(summary);
    }
}
