package com.mediqueue.repository;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_UserId(String patientId);
    List<Appointment> findByDoctor_UserId(String doctorId);
    List<Appointment> findByAppointmentDate(LocalDate date);
    List<Appointment> findByAppointmentStatus(AppointmentStatus status);
}
