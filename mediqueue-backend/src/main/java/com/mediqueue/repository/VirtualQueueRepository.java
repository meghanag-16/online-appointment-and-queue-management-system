package com.mediqueue.repository;

import com.mediqueue.entity.VirtualQueue;
import com.mediqueue.entity.enums.QueueStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VirtualQueueRepository extends JpaRepository<VirtualQueue, Long> {
    List<VirtualQueue> findByDoctor_UserIdAndQueueDate(String doctorId, LocalDate date);

    Optional<VirtualQueue> findByAppointment_AppointmentId(Long appointmentId);

    long countByDoctor_UserIdAndQueueDateAndVisitStatus(
            String doctorId, LocalDate date, QueueStatus status);
}
