package com.mediqueue.security;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.repository.AppointmentRepository;
import org.springframework.stereotype.Component;

/**
 * Ownership rules from the requirements, in one place:
 *  - Patients see only their own data.
 *  - Doctors see only patients on their own appointments.
 *  - Lab technicians work with appointments and reports, but not prescriptions.
 *  - Receptionists and administrators can see everything.
 *
 * Role checks (which role may call an endpoint) stay in @PreAuthorize; this class answers
 * "may THIS user touch THIS record".
 */
@Component
public class AccessGuard {

    private final CurrentUserService currentUser;
    private final AppointmentRepository appointmentRepository;

    public AccessGuard(CurrentUserService currentUser, AppointmentRepository appointmentRepository) {
        this.currentUser = currentUser;
        this.appointmentRepository = appointmentRepository;
    }

    /** Clinical patient data: the patient, a doctor who has an appointment with them, or staff. */
    public void requirePatientAccess(String patientId) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff()) return;
        if (me.is(UserRole.PATIENT) && me.userId().equals(patientId)) return;
        if (me.is(UserRole.DOCTOR)
                && appointmentRepository.existsByDoctor_UserIdAndPatient_UserId(me.userId(), patientId)) return;
        throw new ForbiddenException("Access denied: you can only view your own patients' records");
    }

    /** Personal data with no clinical reason for doctors to see it (billing, patient dashboard). */
    public void requireSelfOrStaff(String userId) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff() || me.userId().equals(userId)) return;
        throw new ForbiddenException("Access denied: you can only view your own data");
    }

    /** Doctor-scoped data (dashboard, queue, schedule): that doctor, or staff. */
    public void requireDoctorSelfOrStaff(String doctorId) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff() || (me.is(UserRole.DOCTOR) && me.userId().equals(doctorId))) return;
        throw new ForbiddenException("Access denied: you can only view your own schedule");
    }

    /** Reading one appointment. Lab technicians may read appointments to attach reports to them. */
    public void requireAppointmentRead(Appointment a) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff() || me.is(UserRole.LAB_TECHNICIAN) || isParticipant(me, a)) return;
        throw new ForbiddenException("Access denied: this appointment belongs to someone else");
    }

    /** Changing an appointment (cancel, status): the patient or doctor on it, or staff. */
    public void requireAppointmentWrite(Appointment a) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff() || isParticipant(me, a)) return;
        throw new ForbiddenException("Access denied: this appointment belongs to someone else");
    }

    /** Clinical writes (prescriptions): only the appointment's own doctor; administrators may override. */
    public void requireTreatingDoctor(Appointment a) {
        AuthenticatedUser me = currentUser.get();
        if (me.is(UserRole.ADMINISTRATOR)) return;
        if (me.is(UserRole.DOCTOR) && a.getDoctor() != null && me.userId().equals(a.getDoctor().getUserId())) return;
        throw new ForbiddenException("Access denied: only the doctor on this appointment can do this");
    }

    /** Documents tied to an appointment (bills, lab reports): its patient, its doctor, staff, optionally lab. */
    public void requireAppointmentDocumentRead(Appointment a, boolean allowLabTechnician) {
        AuthenticatedUser me = currentUser.get();
        if (me.isStaff() || isParticipant(me, a)) return;
        if (allowLabTechnician && me.is(UserRole.LAB_TECHNICIAN)) return;
        throw new ForbiddenException("Access denied: this appointment belongs to someone else");
    }

    private boolean isParticipant(AuthenticatedUser me, Appointment a) {
        return switch (me.role()) {
            case PATIENT -> a.getPatient() != null && me.userId().equals(a.getPatient().getUserId());
            case DOCTOR -> a.getDoctor() != null && me.userId().equals(a.getDoctor().getUserId());
            default -> false;
        };
    }
}
