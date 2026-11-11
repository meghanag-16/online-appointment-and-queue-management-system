package com.mediqueue.repository;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_UserId(String patientId);
    List<Appointment> findByDoctor_UserId(String doctorId);
    List<Appointment> findByDoctor_UserIdAndPatient_UserId(String doctorId, String patientId);
    List<Appointment> findByAppointmentDate(LocalDate date);
    List<Appointment> findByAppointmentStatus(AppointmentStatus status);
    List<Appointment> findByAppointmentDateGreaterThanEqualAndAppointmentStatusIn(LocalDate from, Collection<AppointmentStatus> statuses);

    boolean existsByDoctor_UserIdAndPatient_UserId(String doctorId, String patientId);

    /** Does the patient already have a live appointment overlapping this time (with any doctor)? */
    boolean existsByPatient_UserIdAndAppointmentStatusInAndSlot_StartTimeLessThanAndSlot_EndTimeGreaterThan(
        String patientId, Collection<AppointmentStatus> statuses, java.time.LocalDateTime end, java.time.LocalDateTime start);

    // ── counts (database-side, no findAll().stream()) ──────────────────────
    long countByAppointmentStatus(AppointmentStatus status);
    long countByAppointmentDate(LocalDate date);
    long countByAppointmentDateGreaterThanEqualAndAppointmentStatusIn(LocalDate from, Collection<AppointmentStatus> statuses);

    /** Lab search: one appointment by ID, or a patient's appointments by patient ID or name. */
    @Query("""
        select a from Appointment a
        where a.appointmentId = :appointmentId
           or a.patient.userId = :text
           or lower(a.patient.name) like lower(concat('%', :text, '%'))
        order by a.appointmentDate desc, a.appointmentId desc
        """)
    List<Appointment> searchForLab(@Param("appointmentId") Long appointmentId,
                                   @Param("text") String text,
                                   org.springframework.data.domain.Pageable page);

    /**
     * Live appointments starting within (from, until] that have not had a reminder yet.
     * Used by the reminder job; the NOT EXISTS keeps it to one reminder per appointment.
     */
    @Query("""
        select a from Appointment a
        where a.appointmentStatus in :statuses
          and a.slot.startTime > :from
          and a.slot.startTime <= :until
          and not exists (select n.notificationId from Notification n
                          where n.appointmentId = a.appointmentId
                            and n.type = com.mediqueue.entity.enums.NotificationType.APPOINTMENT_REMINDER)
        """)
    List<Appointment> findDueForReminder(@Param("statuses") Collection<AppointmentStatus> statuses,
                                         @Param("from") java.time.LocalDateTime from,
                                         @Param("until") java.time.LocalDateTime until);
    long countByAppointmentDateAndAppointmentStatus(LocalDate date, AppointmentStatus status);
    long countByDoctor_UserIdAndAppointmentDateAndAppointmentStatusNot(String doctorId, LocalDate date, AppointmentStatus status);
    long countByDoctor_UserIdAndAppointmentDateAndAppointmentStatus(String doctorId, LocalDate date, AppointmentStatus status);
    long countByPatient_UserIdAndAppointmentDateGreaterThanEqualAndAppointmentStatusIn(
        String patientId, LocalDate from, Collection<AppointmentStatus> statuses);

    /**
     * Appointments of this doctor, up to the given day, in one of the given statuses, that have no
     * prescription yet. One query instead of one prescription lookup per appointment.
     */
    @Query("""
        select count(a) from Appointment a
        where a.doctor.userId = :doctorId
          and a.appointmentDate <= :upTo
          and a.appointmentStatus in :statuses
          and not exists (select p.prescriptionId from Prescription p where p.appointment = a)
        """)
    long countWithoutPrescription(@Param("doctorId") String doctorId,
                                  @Param("upTo") LocalDate upTo,
                                  @Param("statuses") Collection<AppointmentStatus> statuses);
}
