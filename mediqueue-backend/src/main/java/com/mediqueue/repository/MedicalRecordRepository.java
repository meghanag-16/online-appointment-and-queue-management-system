package com.mediqueue.repository;
import com.mediqueue.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    Optional<MedicalRecord> findByPatient_UserId(String patientId);
}
