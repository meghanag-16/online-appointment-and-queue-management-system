package com.mediqueue.repository;

import com.mediqueue.entity.Bill;
import com.mediqueue.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByAppointment_AppointmentId(Long appointmentId);
    List<Bill> findByAppointment_Patient_UserIdOrderByGeneratedAtDesc(String patientId);
    List<Bill> findByAppointment_Patient_UserIdAndPaymentStatusNotOrderByGeneratedAtDesc(String patientId, PaymentStatus excluded);
    List<Bill> findAllByOrderByGeneratedAtDesc();
    List<Bill> findByPaymentStatusOrderByGeneratedAtDesc(PaymentStatus status);
    long countByAppointment_Patient_UserIdAndPaymentStatusIn(String patientId, Collection<PaymentStatus> statuses);
    long countByPaymentStatusIn(Collection<PaymentStatus> statuses);

    @Query("select coalesce(sum(b.totalAmount), 0) from Bill b where b.paymentStatus in :statuses")
    BigDecimal sumAmountByPaymentStatusIn(@Param("statuses") Collection<PaymentStatus> statuses);
}
