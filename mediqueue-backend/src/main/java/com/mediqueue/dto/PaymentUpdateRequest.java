package com.mediqueue.dto;

public class PaymentUpdateRequest {
    private String paymentStatus;
    private String paymentMethod;

    public PaymentUpdateRequest() {}

    public PaymentUpdateRequest(String paymentStatus, String paymentMethod) {
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
