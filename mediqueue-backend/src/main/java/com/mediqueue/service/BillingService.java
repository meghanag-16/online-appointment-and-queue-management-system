package com.mediqueue.service;

import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import java.util.List;

public interface BillingService {

    /**
     * Staff: (re)price an unpaid bill. {@code billingType} null or "AUTO" picks the rule automatically;
     * STANDARD / EMERGENCY / FOLLOW_UP force one.
     */
    BillResponse generateBill(Long appointmentId, String billingType);

    /** Creates the bill for a new booking, or re-prices an unpaid one after a priority or time change. */
    void priceAppointment(Long appointmentId);

    /** The appointment was cancelled: an unpaid bill becomes VOID, a paid one REFUNDED. */
    void settleCancelledAppointment(Long appointmentId);

    /** Read-only: never creates a bill (bills are created when the appointment is booked). */
    BillResponse getBill(Long appointmentId);

    List<BillResponse> getBillsForPatient(String patientId);

    /** Front desk: all bills, optionally one payment status and a patient name/ID or appointment ID search. */
    List<BillResponse> getAll(String status, String query);

    /** Front desk: mark paid (with the method), failed, or refunded. */
    BillResponse updatePaymentStatus(Long billId, PaymentUpdateRequest request);
}
