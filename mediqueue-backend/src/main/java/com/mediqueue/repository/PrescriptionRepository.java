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

    /**
     * Is this a follow-up visit? True when the same doctor issued the patient a prescription at an
     * earlier visit with a follow-up date no earlier than {@code earliestFollowUp} (this visit's
     * date minus the grace period).
     */
    @Query("""
        select count(p) > 0 from Prescription p
        where p.appointment.patient.userId = :patientId
          and p.appointment.doctor.userId = :doctorId
          and p.appointment.appointmentId <> :appointmentId
          and p.appointment.appointmentDate < :visitDate
          and p.followUpDate is not null
          and p.followUpDate >= :earliestFollowUp
        """)
    boolean isFollowUpVisit(@Param("patientId") String patientId,
                            @Param("doctorId") String doctorId,
                            @Param("appointmentId") Long appointmentId,
                            @Param("visitDate") java.time.LocalDate visitDate,
                            @Param("earliestFollowUp") java.time.LocalDate earliestFollowUp);

    /** Which of these appointments already have a prescription (one query for a whole list). */
    @Query("select p.appointment.appointmentId from Prescription p where p.appointment.appointmentId in :ids")
    List<Long> findAppointmentIdsWithPrescription(@Param("ids") Collection<Long> ids);
}
