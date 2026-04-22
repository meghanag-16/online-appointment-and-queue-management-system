package com.mediqueue.repository;
import com.mediqueue.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByAppointment_AppointmentId(Long appointmentId);
    List<Bill> findByAppointment_Patient_UserId(String patientId);
}
