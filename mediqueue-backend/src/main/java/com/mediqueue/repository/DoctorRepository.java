package com.mediqueue.repository;

import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.enums.AccountStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, String> {
    List<Doctor> findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(
            String name, String specialization);

    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);

    List<Doctor> findByDepartment_DepartmentId(String departmentId);

    List<Doctor> findByAccountStatus(AccountStatus status);
}
