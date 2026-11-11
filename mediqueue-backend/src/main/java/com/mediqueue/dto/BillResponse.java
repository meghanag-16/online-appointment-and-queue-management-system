package com.mediqueue.dto;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A bill with enough appointment detail for the patient's and the front desk's billing screens. */
public class BillResponse {
    private Long billId;
    private Long appointmentId;
    private String patientId;
    private String patientName;
    private String doctorName;
    private LocalDateTime appointmentStart;
    private String appointmentStatus;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private LocalDateTime generatedAt;
    private LocalDateTime paidAt;
    /** STANDARD, EMERGENCY or FOLLOW_UP. */
    private String billingStrategy;
    private String billingRule;

    public BillResponse() {}

    public static BillResponse from(Bill bill, String billingRule) {
        BillResponse r = new BillResponse();
        r.billId = bill.getBillId();
        Appointment a = bill.getAppointment();
        if (a != null) {
            r.appointmentId = a.getAppointmentId();
            r.patientId = a.getPatient() != null ? a.getPatient().getUserId() : null;
            r.patientName = a.getPatient() != null ? a.getPatient().getName() : null;
            r.doctorName = a.getDoctor() != null ? a.getDoctor().getName() : null;
            r.appointmentStart = a.getSlot() != null ? a.getSlot().getStartTime()
                : a.getAppointmentDate() != null ? a.getAppointmentDate().atStartOfDay() : null;
            r.appointmentStatus = a.getAppointmentStatus() != null ? a.getAppointmentStatus().name() : null;
        }
        r.totalAmount = bill.getTotalAmount();
        r.paymentStatus = bill.getPaymentStatus();
        r.paymentMethod = bill.getPaymentMethod();
        r.generatedAt = bill.getGeneratedAt();
        r.paidAt = bill.getPaidAt();
        r.billingStrategy = bill.getBillingType() != null ? bill.getBillingType().name() : null;
        r.billingRule = billingRule;
        return r;
    }

    public Long getBillId() { return billId; }
    public Long getAppointmentId() { return appointmentId; }
    public String getPatientId() { return patientId; }
    public String getPatientName() { return patientName; }
    public String getDoctorName() { return doctorName; }
    public LocalDateTime getAppointmentStart() { return appointmentStart; }
    public String getAppointmentStatus() { return appointmentStatus; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public String getBillingStrategy() { return billingStrategy; }
    public String getBillingRule() { return billingRule; }
}
