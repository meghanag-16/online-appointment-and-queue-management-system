package com.mediqueue.entity;

import com.mediqueue.entity.enums.QueueStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "virtual_queue")
public class VirtualQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "queue_id")
    private Long queueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @Column(name = "queue_date")
    private LocalDate queueDate;

    @Column(name = "queue_position")
    private Integer queuePosition;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_status")
    private QueueStatus visitStatus = QueueStatus.WAITING;

    /** When the doctor called this patient in (CALLED / IN_CONSULTATION are ordered by this). */
    @Column(name = "called_at")
    private LocalDateTime calledAt;

    /** Administrator override: keep this waiting patient at this position (null = normal order). */
    @Column(name = "override_position")
    private Integer overridePosition;

    public VirtualQueue() {}

    public VirtualQueue(Long queueId, Doctor doctor, Appointment appointment, LocalDate queueDate, Integer queuePosition, QueueStatus visitStatus) {
        this.queueId = queueId;
        this.doctor = doctor;
        this.appointment = appointment;
        this.queueDate = queueDate;
        this.queuePosition = queuePosition;
        this.visitStatus = visitStatus;
    }

    public Long getQueueId() { return queueId; }
    public void setQueueId(Long queueId) { this.queueId = queueId; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public LocalDate getQueueDate() { return queueDate; }
    public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }

    public Integer getQueuePosition() { return queuePosition; }
    public void setQueuePosition(Integer queuePosition) { this.queuePosition = queuePosition; }

    public QueueStatus getVisitStatus() { return visitStatus; }
    public void setVisitStatus(QueueStatus visitStatus) { this.visitStatus = visitStatus; }

    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }

    public Integer getOverridePosition() { return overridePosition; }
    public void setOverridePosition(Integer overridePosition) { this.overridePosition = overridePosition; }
}
