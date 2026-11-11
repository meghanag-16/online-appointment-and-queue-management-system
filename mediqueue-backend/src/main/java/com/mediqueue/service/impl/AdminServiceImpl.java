package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.dto.AccountCreatedResponse;
import com.mediqueue.dto.AdminDashboardResponse;
import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.dto.DepartmentRequest;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.RegisterRequest;
import com.mediqueue.entity.Department;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.entity.enums.ResolutionStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.ComplaintRepository;
import com.mediqueue.repository.DepartmentRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.service.AdminService;
import com.mediqueue.service.SlotService;
import com.mediqueue.service.UserAccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES =
        List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS);
    private static final List<ResolutionStatus> OPEN_COMPLAINT_STATUSES =
        List.of(ResolutionStatus.OPEN, ResolutionStatus.UNDER_REVIEW);

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserAccountService userAccountService;
    private final SlotService slotService;
    private final BillRepository billRepository;
    private final AuditService auditService;

    public AdminServiceImpl(DoctorRepository doctorRepository,
                            DepartmentRepository departmentRepository,
                            UserRepository userRepository,
                            AppointmentRepository appointmentRepository,
                            ComplaintRepository complaintRepository,
                            UserAccountService userAccountService,
                            SlotService slotService,
                            BillRepository billRepository,
                            AuditService auditService) {
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.complaintRepository = complaintRepository;
        this.userAccountService = userAccountService;
        this.slotService = slotService;
        this.billRepository = billRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDTO> getAllDoctors() {
        List<Doctor> doctors = doctorRepository.findAll();
        if (!doctors.isEmpty()) {
            return doctors.stream().map(DoctorDTO::from).toList();
        }
        // Fallback for doctor users inserted by hand without a row in the doctors table.
        return userRepository.findAllDoctorUsersRaw().stream().map(row -> {
            DoctorDTO dto = new DoctorDTO((String) row[0], (String) row[1], (String) row[3], "DOCTOR", null);
            dto.setUsername((String) row[2]);
            dto.setAccountStatus((String) row[5]);
            return dto;
        }).toList();
    }

    @Override
    public AccountCreatedResponse onboardDoctor(RegisterRequest request) {
        request.setRole(UserRole.DOCTOR);
        var created = userAccountService.createByAdmin(request);
        return new AccountCreatedResponse(DoctorDTO.from((Doctor) created.user()), created.temporaryPassword());
    }

    @Override
    public DoctorDTO deactivateDoctor(String doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
        AccountStatus previous = doctor.getAccountStatus();
        doctor.setAccountStatus(AccountStatus.DEACTIVATED);
        Doctor saved = doctorRepository.save(doctor);
        if (previous != AccountStatus.DEACTIVATED) {
            auditService.record(AuditAction.USER_STATUS_CHANGED, "USER", doctorId,
                saved.getName() + " (DOCTOR): " + previous + " → DEACTIVATED");
        }
        slotService.withdrawOpenSlots(doctorId);   // a deactivated doctor can no longer be booked
        return DoctorDTO.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream().map(DepartmentDTO::from).toList();
    }

    @Override
    public DepartmentDTO addDepartment(DepartmentRequest request) {
        String name = request.departmentName().trim();
        if (departmentRepository.existsByDepartmentNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Department already exists: " + name);
        }
        Department dept = new Department(
            "DEPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(), name);
        Department saved = departmentRepository.save(dept);
        auditService.record(AuditAction.DEPARTMENT_ADDED, "DEPARTMENT", saved.getDepartmentId(), name);
        return DepartmentDTO.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        List<PaymentStatus> unpaid = List.of(PaymentStatus.PENDING, PaymentStatus.FAILED);
        return new AdminDashboardResponse(
            userRepository.count(),
            userRepository.countByAccountStatus(AccountStatus.ACTIVE),
            userRepository.countByRoleAndAccountStatus(UserRole.PATIENT, AccountStatus.ACTIVE),
            userRepository.countByRoleAndAccountStatus(UserRole.DOCTOR, AccountStatus.ACTIVE),
            userRepository.countByAccountStatus(AccountStatus.SUSPENDED) + userRepository.countByAccountStatus(AccountStatus.DEACTIVATED),
            appointmentRepository.countByAppointmentDate(today),
            // upcoming visits still to happen: today or later, booked/confirmed/in progress (not stale past ones)
            appointmentRepository.countByAppointmentDateGreaterThanEqualAndAppointmentStatusIn(today, ACTIVE_APPOINTMENT_STATUSES),
            complaintRepository.countByResolutionStatusIn(OPEN_COMPLAINT_STATUSES),
            billRepository.countByPaymentStatusIn(unpaid),
            billRepository.sumAmountByPaymentStatusIn(unpaid),
            billRepository.sumAmountByPaymentStatusIn(List.of(PaymentStatus.PAID)));
    }
}
