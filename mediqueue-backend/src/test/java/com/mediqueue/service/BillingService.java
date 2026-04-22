package com.mediqueue.service;

import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import java.util.List;

public interface BillingService {
    BillResponse generateBill(Long appointmentId, String billingType);
    BillResponse getBill(Long appointmentId);
    BillResponse updatePaymentStatus(Long billId, PaymentUpdateRequest request);
    List<BillResponse> getBillsForPatient(String patientId);
}
