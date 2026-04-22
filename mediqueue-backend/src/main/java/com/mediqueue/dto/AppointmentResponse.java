package com.mediqueue.dto;

import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.Priority;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AppointmentResponse {
    private Long appointmentId;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private Long slotId;
    private LocalDate appointmentDate;
    private String reasonForVisit;
    private AppointmentStatus status;
    private Priority priority;
    private List<AlternateSlot> alternateSlots;

    public AppointmentResponse() {}

    public AppointmentResponse(Long appointmentId, String patientId, String patientName, String doctorId, String doctorName, Long slotId, LocalDate appointmentDate, String reasonForVisit, AppointmentStatus status, Priority priority, List<AlternateSlot> alternateSlots) {
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.patientName = patientName;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.slotId = slotId;
        this.appointmentDate = appointmentDate;
        this.reasonForVisit = reasonForVisit;
        this.status = status;
        this.priority = priority;
        this.alternateSlots = alternateSlots;
    }

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

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public List<AlternateSlot> getAlternateSlots() { return alternateSlots; }
    public void setAlternateSlots(List<AlternateSlot> alternateSlots) { this.alternateSlots = alternateSlots; }

    public static class AlternateSlot {
        private Long slotId;
        private String doctorId;
        private String doctorName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String reason;

        public AlternateSlot() {}

        public AlternateSlot(Long slotId, String doctorId, String doctorName, LocalDateTime startTime, LocalDateTime endTime, String reason) {
            this.slotId = slotId;
            this.doctorId = doctorId;
            this.doctorName = doctorName;
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

        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
