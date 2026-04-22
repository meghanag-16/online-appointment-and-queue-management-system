package com.mediqueue.repository;
import com.mediqueue.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PatientRepository extends JpaRepository<Patient, String> {}
