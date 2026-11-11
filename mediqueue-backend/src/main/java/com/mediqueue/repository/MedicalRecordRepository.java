package com.mediqueue.repository;

import com.mediqueue.entity.MedicalRecord;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    Optional<MedicalRecord> findByPatient_UserId(String patientId);
}
