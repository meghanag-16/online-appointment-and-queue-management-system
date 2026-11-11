package com.mediqueue.service;

import com.mediqueue.dto.AccountCreatedResponse;
import com.mediqueue.dto.AdminDashboardResponse;
import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.dto.DepartmentRequest;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorUpdateRequest;
import com.mediqueue.dto.RegisterRequest;
import java.util.List;

public interface AdminService {
    List<DoctorDTO> getAllDoctors();

    /**
     * Onboards a doctor through the shared user-creation path (same fields as self-registration).
     */
    AccountCreatedResponse onboardDoctor(RegisterRequest request);

    /** Deactivates the doctor and cancels their upcoming appointments (patients are notified). */
    DoctorDTO deactivateDoctor(String doctorId);

    /**
     * Changes a doctor's department, specialization, qualification and fee. New bookings use the
     * new fee.
     */
    DoctorDTO updateDoctor(String doctorId, DoctorUpdateRequest request);

    List<DepartmentDTO> getAllDepartments();

    DepartmentDTO addDepartment(DepartmentRequest request);

    AdminDashboardResponse getDashboard();
}
