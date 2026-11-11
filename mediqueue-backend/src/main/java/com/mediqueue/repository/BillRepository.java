package com.mediqueue.repository;

import com.mediqueue.entity.Bill;
import com.mediqueue.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByAppointment_AppointmentId(Long appointmentId);
    List<Bill> findByAppointment_Patient_UserId(String patientId);
    long countByAppointment_Patient_UserIdAndPaymentStatusIn(String patientId, Collection<PaymentStatus> statuses);
}
