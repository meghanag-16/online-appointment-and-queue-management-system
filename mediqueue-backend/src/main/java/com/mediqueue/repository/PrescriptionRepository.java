package com.mediqueue.repository;
import com.mediqueue.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Optional<Prescription> findByAppointment_AppointmentId(Long appointmentId);
    List<Prescription> findByAppointment_Doctor_UserId(String doctorId);
}
