package com.mediqueue.entity;

import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.CreatedByRole;
import com.mediqueue.entity.enums.Priority;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @Column(name = "appointment_id")
    private Long appointmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private TimeSlot slot;

    @Column(name = "appointment_date")
    private LocalDate appointmentDate;

    @Column(name = "booking_time")
    private LocalDateTime bookingTime;

    @Column(name = "reason_for_visit", columnDefinition = "TEXT")
    private String reasonForVisit;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_status")
    private AppointmentStatus appointmentStatus = AppointmentStatus.BOOKED;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "created_by_role")
    private CreatedByRole createdByRole = CreatedByRole.PATIENT;

    public Appointment() {}

    public Appointment(Long appointmentId, Patient patient, Doctor doctor, TimeSlot slot, LocalDate appointmentDate, LocalDateTime bookingTime, String reasonForVisit, AppointmentStatus appointmentStatus, Priority priority, CreatedByRole createdByRole) {
        this.appointmentId = appointmentId;
        this.patient = patient;
        this.doctor = doctor;
        this.slot = slot;
        this.appointmentDate = appointmentDate;
        this.bookingTime = bookingTime;
        this.reasonForVisit = reasonForVisit;
        this.appointmentStatus = appointmentStatus;
        this.priority = priority;
        this.createdByRole = createdByRole;
    }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public TimeSlot getSlot() { return slot; }
    public void setSlot(TimeSlot slot) { this.slot = slot; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public AppointmentStatus getAppointmentStatus() { return appointmentStatus; }
    public void setAppointmentStatus(AppointmentStatus appointmentStatus) { this.appointmentStatus = appointmentStatus; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public CreatedByRole getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(CreatedByRole createdByRole) { this.createdByRole = createdByRole; }

    @PrePersist
    public void prePersist() {
        if (bookingTime == null) bookingTime = LocalDateTime.now();
    }
}
