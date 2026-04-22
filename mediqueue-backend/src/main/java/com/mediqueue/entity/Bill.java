package com.mediqueue.entity;

import com.mediqueue.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bill_id")
    private Long billId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    public Bill() {}

    public Bill(Long billId, Appointment appointment, BigDecimal totalAmount, PaymentStatus paymentStatus, String paymentMethod, LocalDateTime generatedAt) {
        this.billId = billId;
        this.appointment = appointment;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.generatedAt = generatedAt;
    }

    public Long getBillId() { return billId; }
    public void setBillId(Long billId) { this.billId = billId; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    @PrePersist
    public void prePersist() {
        if (generatedAt == null) generatedAt = LocalDateTime.now();
    }
}
