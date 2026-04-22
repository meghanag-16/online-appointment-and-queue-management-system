package com.mediqueue.controller;

import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.service.BillingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/generate/{appointmentId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<BillResponse> generate(
            @PathVariable Long appointmentId,
            @RequestParam(defaultValue = "STANDARD") String billingType) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(billingService.generateBill(appointmentId, billingType));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<BillResponse> getByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(billingService.getBill(appointmentId));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<?> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(billingService.getBillsForPatient(patientId));
    }

    @PatchMapping("/{billId}/payment")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMINISTRATOR')")
    public ResponseEntity<BillResponse> updatePayment(
            @PathVariable Long billId,
            @RequestBody PaymentUpdateRequest req) {
        return ResponseEntity.ok(billingService.updatePaymentStatus(billId, req));
    }
}
