package com.mediqueue.service;

import com.mediqueue.dto.AccountCreatedResponse;
import com.mediqueue.dto.AdminDashboardResponse;
import com.mediqueue.dto.DepartmentDTO;
import com.mediqueue.dto.DepartmentRequest;
import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.RegisterRequest;

import java.util.List;

public interface AdminService {
    List<DoctorDTO> getAllDoctors();
    /** Onboards a doctor through the shared user-creation path (same fields as self-registration). */
    AccountCreatedResponse onboardDoctor(RegisterRequest request);
    DoctorDTO deactivateDoctor(String doctorId);
    List<DepartmentDTO> getAllDepartments();
    DepartmentDTO addDepartment(DepartmentRequest request);
    AdminDashboardResponse getDashboard();
}
