package com.mediqueue.dto;

import com.mediqueue.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BillResponse {
    private Long billId;
    private Long appointmentId;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private LocalDateTime generatedAt;
    private String billingStrategy;

    public BillResponse() {}

    public BillResponse(Long billId, Long appointmentId, BigDecimal totalAmount, PaymentStatus paymentStatus, String paymentMethod, LocalDateTime generatedAt, String billingStrategy) {
        this.billId = billId;
        this.appointmentId = appointmentId;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.generatedAt = generatedAt;
        this.billingStrategy = billingStrategy;
    }

    public Long getBillId() { return billId; }
    public void setBillId(Long billId) { this.billId = billId; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public String getBillingStrategy() { return billingStrategy; }
    public void setBillingStrategy(String billingStrategy) { this.billingStrategy = billingStrategy; }
}
