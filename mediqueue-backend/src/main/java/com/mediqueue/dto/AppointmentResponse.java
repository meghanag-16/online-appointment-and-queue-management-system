package com.mediqueue.dto;

import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.Priority;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * One appointment as seen by the CURRENT user. Besides the data, it says what that user may do
 * next (canCancel, canReschedule, allowedStatuses), so the UI never offers an action the server
 * would reject.
 */
public class AppointmentResponse {
    private Long appointmentId;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;
    private Long slotId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDate appointmentDate;
    private LocalDateTime bookingTime;
    private String reasonForVisit;
    private AppointmentStatus status;
    private Priority priority;

    private boolean canCancel;
    private boolean canReschedule;
    /** Patients must cancel or reschedule before this moment (slot start minus the cutoff). */
    private LocalDateTime changeDeadline;
    /** Statuses the current user may move this appointment to. */
    private List<AppointmentStatus> allowedStatuses = List.of();
    /** A prescription has been issued for this appointment. */
    private boolean hasPrescription;

    public AppointmentResponse() {}

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public boolean isCanCancel() { return canCancel; }
    public void setCanCancel(boolean canCancel) { this.canCancel = canCancel; }

    public boolean isCanReschedule() { return canReschedule; }
    public void setCanReschedule(boolean canReschedule) { this.canReschedule = canReschedule; }

    public LocalDateTime getChangeDeadline() { return changeDeadline; }
    public void setChangeDeadline(LocalDateTime changeDeadline) { this.changeDeadline = changeDeadline; }

    public List<AppointmentStatus> getAllowedStatuses() { return allowedStatuses; }
    public void setAllowedStatuses(List<AppointmentStatus> allowedStatuses) { this.allowedStatuses = allowedStatuses; }

    public boolean isHasPrescription() { return hasPrescription; }
    public void setHasPrescription(boolean hasPrescription) { this.hasPrescription = hasPrescription; }

    /** A suggested open slot offered when the requested one is taken. */
    public static class AlternateSlot {
        private Long slotId;
        private String doctorId;
        private String doctorName;
        private String departmentName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        /** "same_doctor" or "same_department". */
        private String reason;

        public AlternateSlot() {}

        public AlternateSlot(Long slotId, String doctorId, String doctorName, String departmentName,
                             LocalDateTime startTime, LocalDateTime endTime, String reason) {
            this.slotId = slotId;
            this.doctorId = doctorId;
            this.doctorName = doctorName;
            this.departmentName = departmentName;
            this.startTime = startTime;
            this.endTime = endTime;
            this.reason = reason;
        }

        public Long getSlotId() { return slotId; }
        public void setSlotId(Long slotId) { this.slotId = slotId; }

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
