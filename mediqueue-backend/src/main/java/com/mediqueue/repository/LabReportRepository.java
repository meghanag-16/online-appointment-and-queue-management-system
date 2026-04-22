package com.mediqueue.repository;
import com.mediqueue.entity.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    List<LabReport> findByAppointment_AppointmentId(Long appointmentId);
    List<LabReport> findByAppointment_Patient_UserId(String patientId);
}
