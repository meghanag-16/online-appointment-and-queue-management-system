package com.mediqueue.repository;

import com.mediqueue.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Optional<Prescription> findByAppointment_AppointmentId(Long appointmentId);
    boolean existsByAppointment_AppointmentId(Long appointmentId);
    List<Prescription> findByAppointment_Doctor_UserIdOrderByIssuedAtDesc(String doctorId);
    List<Prescription> findByAppointment_Patient_UserIdOrderByIssuedAtDesc(String patientId);

    /** Which of these appointments already have a prescription (one query for a whole list). */
    @Query("select p.appointment.appointmentId from Prescription p where p.appointment.appointmentId in :ids")
    List<Long> findAppointmentIdsWithPrescription(@Param("ids") Collection<Long> ids);
}
