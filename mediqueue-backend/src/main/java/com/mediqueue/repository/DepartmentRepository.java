package com.mediqueue.repository;
import com.mediqueue.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DepartmentRepository extends JpaRepository<Department, String> {}
