package com.mediqueue.repository;

import com.mediqueue.entity.LabReport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    List<LabReport> findByAppointment_AppointmentIdOrderByUploadTimeDesc(Long appointmentId);

    List<LabReport> findByAppointment_Patient_UserIdOrderByUploadTimeDesc(String patientId);

    List<LabReport> findAllByOrderByUploadTimeDesc();

    long countByAppointment_Patient_UserId(String patientId);

    long countByAppointment_AppointmentId(Long appointmentId);
}
