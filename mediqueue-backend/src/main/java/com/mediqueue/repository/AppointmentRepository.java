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

    boolean existsByDoctor_UserIdAndPatient_UserId(String doctorId, String patientId);

    // ── counts (database-side, no findAll().stream()) ──────────────────────
    long countByAppointmentStatus(AppointmentStatus status);
    long countByAppointmentDate(LocalDate date);
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
