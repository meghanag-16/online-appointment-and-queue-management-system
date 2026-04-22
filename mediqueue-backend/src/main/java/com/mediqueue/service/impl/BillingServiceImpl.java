package com.mediqueue.service.impl;

import com.mediqueue.billing.*;
import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.service.BillingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BillingServiceImpl implements BillingService {

    private final BillRepository        billRepository;
    private final AppointmentRepository appointmentRepository;
    private final StandardBilling       standardBilling;
    private final EmergencyBilling      emergencyBilling;
    private final FollowUpBilling       followUpBilling;
    private final BillingContext        billingContext;

    public BillingServiceImpl(BillRepository billRepository, AppointmentRepository appointmentRepository,
                            StandardBilling standardBilling, EmergencyBilling emergencyBilling,
                            FollowUpBilling followUpBilling, BillingContext billingContext) {
        this.billRepository = billRepository;
        this.appointmentRepository = appointmentRepository;
        this.standardBilling = standardBilling;
        this.emergencyBilling = emergencyBilling;
        this.followUpBilling = followUpBilling;
        this.billingContext = billingContext;
    }

    @Override
    public BillResponse generateBill(Long appointmentId, String billingType) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // ── select strategy ──────────────────────────────────────────────────
        BillingStrategy strategy = resolveStrategy(billingType);
        billingContext.setStrategy(strategy);

        BigDecimal amount;
        try {
                amount = billingContext.executeStrategy(appointment);
        if (amount == null) {
                amount = BigDecimal.valueOf(500); // fallback
        }
        } catch (Exception e) {
               amount = BigDecimal.valueOf(500); // fallback if strategy fails
        }     

        // ── persist bill ─────────────────────────────────────────────────────
        Bill bill = billRepository.findByAppointment_AppointmentId(appointmentId)
            .orElse(new Bill());
        bill.setAppointment(appointment);
        bill.setTotalAmount(amount);
        bill.setPaymentStatus(PaymentStatus.PENDING);

        Bill saved = billRepository.save(bill);
        return toResponse(saved, billingContext.currentStrategyName());
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBill(Long appointmentId) {
        // If no bill exists yet, auto-generate a standard one
        return billRepository.findByAppointment_AppointmentId(appointmentId)
            .map(bill -> toResponse(bill, null))
            .orElseGet(() -> generateBill(appointmentId, "STANDARD"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponse> getBillsForPatient(String patientId) {
        return billRepository.findByAppointment_Patient_UserId(patientId)
            .stream()
            .map(bill -> toResponse(bill, null))
            .collect(Collectors.toList());
    }

    @Override
    public BillResponse updatePaymentStatus(Long billId, PaymentUpdateRequest req) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));

        bill.setPaymentStatus(PaymentStatus.valueOf(req.getPaymentStatus().toUpperCase()));
        bill.setPaymentMethod(req.getPaymentMethod());

        Bill saved = billRepository.save(bill);
        return toResponse(saved, null);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private BillingStrategy resolveStrategy(String type) {
        if (type == null) return standardBilling;
        return switch (type.toUpperCase()) {
            case "EMERGENCY"  -> emergencyBilling;
            case "FOLLOW_UP"  -> followUpBilling;
            default           -> standardBilling;
        };
    }

    private BillResponse toResponse(Bill bill, String strategyName) {
        BillResponse r = new BillResponse();
        r.setBillId(bill.getBillId());
        if (bill.getAppointment() != null)
            r.setAppointmentId(bill.getAppointment().getAppointmentId());
        r.setTotalAmount(bill.getTotalAmount());
        r.setPaymentStatus(bill.getPaymentStatus());
        r.setPaymentMethod(bill.getPaymentMethod());
        r.setGeneratedAt(bill.getGeneratedAt());
        r.setBillingStrategy(strategyName);
        return r;
    }
}
