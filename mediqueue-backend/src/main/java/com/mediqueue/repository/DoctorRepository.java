package com.mediqueue.repository;
import com.mediqueue.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DoctorRepository extends JpaRepository<Doctor, String> {
    List<Doctor> findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(String name, String specialization);
    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);
    List<Doctor> findByDepartment_DepartmentId(String departmentId);
}
