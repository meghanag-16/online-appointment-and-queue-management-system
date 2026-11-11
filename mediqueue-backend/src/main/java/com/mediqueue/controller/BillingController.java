package com.mediqueue.controller;

import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.service.BillingService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Ownership (patients see only their own bills) is enforced in BillingService via AccessGuard. */
@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    /**
     * Re-price an unpaid bill; billingType AUTO (default) picks the rule from priority and
     * follow-up.
     */
    @PostMapping("/generate/{appointmentId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<BillResponse> generate(
            @PathVariable Long appointmentId,
            @RequestParam(defaultValue = "AUTO") String billingType) {
        return ResponseEntity.ok(billingService.generateBill(appointmentId, billingType));
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<BillResponse> getByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(billingService.getBill(appointmentId));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<BillResponse>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(billingService.getBillsForPatient(patientId));
    }

    /**
     * Front desk billing screen: ?status=PENDING&q=patient name, patient ID, bill or appointment
     * number.
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<List<BillResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(billingService.getAll(status, q));
    }

    /**
     * {"paymentStatus": "PAID", "paymentMethod": "UPI"} — also FAILED, PENDING (retry) and
     * REFUNDED.
     */
    @PatchMapping("/{billId}/payment")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<BillResponse> updatePayment(
            @PathVariable Long billId, @RequestBody PaymentUpdateRequest req) {
        return ResponseEntity.ok(billingService.updatePaymentStatus(billId, req));
    }
}
