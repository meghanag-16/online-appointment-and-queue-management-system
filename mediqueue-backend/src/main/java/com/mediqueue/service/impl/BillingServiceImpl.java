package com.mediqueue.service.impl;

import com.mediqueue.audit.AuditAction;
import com.mediqueue.audit.AuditService;
import com.mediqueue.billing.BillingStrategy;
import com.mediqueue.billing.BillingStrategySelector;
import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.enums.BillingType;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.service.BillingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.mediqueue.entity.enums.PaymentStatus.*;

@Service
@Transactional
public class BillingServiceImpl implements BillingService {

    /** Bills whose amount may still change. */
    private static final Set<PaymentStatus> UNPAID = EnumSet.of(PENDING, FAILED);

    /** Status changes the front desk may make. VOID is set only by the system when a visit is cancelled. */
    private static final Map<PaymentStatus, Set<PaymentStatus>> MANUAL_TRANSITIONS = Map.of(
        PENDING,  EnumSet.of(PAID, FAILED),
        FAILED,   EnumSet.of(PAID, PENDING),
        PAID,     EnumSet.of(REFUNDED),
        REFUNDED, EnumSet.noneOf(PaymentStatus.class),
        VOID,     EnumSet.noneOf(PaymentStatus.class));

    public static final List<String> PAYMENT_METHODS = List.of("CASH", "CARD", "UPI", "INSURANCE", "NET_BANKING");

    private final BillRepository billRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillingStrategySelector selector;
    private final AccessGuard accessGuard;
    private final AuditService auditService;

    public BillingServiceImpl(BillRepository billRepository, AppointmentRepository appointmentRepository,
                              BillingStrategySelector selector, AccessGuard accessGuard, AuditService auditService) {
        this.billRepository = billRepository;
        this.appointmentRepository = appointmentRepository;
        this.selector = selector;
        this.accessGuard = accessGuard;
        this.auditService = auditService;
    }

    @Override
    public BillResponse generateBill(Long appointmentId, String billingType) {
        Appointment appointment = findAppointment(appointmentId);
        Bill bill = billRepository.findByAppointment_AppointmentId(appointmentId).orElse(null);
        if (bill != null && !UNPAID.contains(bill.getPaymentStatus())) {
            throw new BadRequestException("This bill is " + label(bill.getPaymentStatus()) + " and can no longer be re-priced");
        }
        BillingStrategy strategy = billingType == null || billingType.isBlank() || billingType.equalsIgnoreCase("AUTO")
            ? selector.select(appointment)
            : selector.strategyFor(parseType(billingType));
        Bill saved = price(appointment, bill, strategy);
        auditService.record(AuditAction.BILL_REPRICED, "BILL", saved.getBillId(),
            "Appointment #" + appointmentId + " priced as " + strategy.type() + ": " + saved.getTotalAmount());
        return toResponse(saved);
    }

    @Override
    public void priceAppointment(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        Bill bill = billRepository.findByAppointment_AppointmentId(appointmentId).orElse(null);
        if (bill != null && !UNPAID.contains(bill.getPaymentStatus())) return;   // paid/void bills are final
        price(appointment, bill, selector.select(appointment));
    }

    @Override
    public void settleCancelledAppointment(Long appointmentId) {
        billRepository.findByAppointment_AppointmentId(appointmentId).ifPresent(bill -> {
            if (UNPAID.contains(bill.getPaymentStatus())) bill.setPaymentStatus(VOID);
            else if (bill.getPaymentStatus() == PAID) bill.setPaymentStatus(REFUNDED);
            billRepository.save(bill);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBill(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        accessGuard.requireAppointmentDocumentRead(appointment, false);
        return billRepository.findByAppointment_AppointmentId(appointmentId)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("No bill exists for appointment " + appointmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponse> getBillsForPatient(String patientId) {
        accessGuard.requireSelfOrStaff(patientId);
        return billRepository.findByAppointment_Patient_UserIdOrderByGeneratedAtDesc(patientId)
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponse> getAll(String status, String query) {
        List<Bill> bills = status == null || status.isBlank()
            ? billRepository.findAllByOrderByGeneratedAtDesc()
            : billRepository.findByPaymentStatusOrderByGeneratedAtDesc(parseStatus(status));
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return bills.stream()
            .map(this::toResponse)
            .filter(b -> q.isEmpty()
                || String.valueOf(b.getAppointmentId()).equals(q)
                || String.valueOf(b.getBillId()).equals(q)
                || (b.getPatientId() != null && b.getPatientId().toLowerCase(Locale.ROOT).contains(q))
                || (b.getPatientName() != null && b.getPatientName().toLowerCase(Locale.ROOT).contains(q)))
            .toList();
    }

    @Override
    public BillResponse updatePaymentStatus(Long billId, PaymentUpdateRequest req) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
        if (req.getPaymentStatus() == null || req.getPaymentStatus().isBlank()) {
            throw new BadRequestException("Payment status is required");
        }
        PaymentStatus target = parseStatus(req.getPaymentStatus());
        PaymentStatus current = bill.getPaymentStatus();
        if (target == current) return toResponse(bill);
        if (!MANUAL_TRANSITIONS.get(current).contains(target)) {
            throw new BadRequestException("A " + label(current) + " bill cannot be marked " + label(target));
        }
        if (target == PAID) {
            String method = req.getPaymentMethod() == null ? "" : req.getPaymentMethod().trim().toUpperCase(Locale.ROOT);
            if (!PAYMENT_METHODS.contains(method)) {
                throw new BadRequestException("Choose how it was paid: " + String.join(", ", PAYMENT_METHODS));
            }
            bill.setPaymentMethod(method);
            bill.setPaidAt(LocalDateTime.now());
        }
        bill.setPaymentStatus(target);
        Bill saved = billRepository.save(bill);
        auditService.record(AuditAction.BILL_PAYMENT_UPDATED, "BILL", billId,
            label(current) + " → " + label(target) + (target == PAID ? " (" + saved.getPaymentMethod() + ")" : "")
                + ", appointment #" + saved.getAppointment().getAppointmentId());
        return toResponse(saved);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Bill price(Appointment appointment, Bill bill, BillingStrategy strategy) {
        if (bill == null) {
            bill = new Bill();
            bill.setAppointment(appointment);
            bill.setPaymentStatus(PENDING);
        }
        bill.setBillingType(strategy.type());
        bill.setTotalAmount(strategy.calculate(appointment));
        return billRepository.save(bill);
    }

    private BillResponse toResponse(Bill bill) {
        BillingType type = bill.getBillingType() != null ? bill.getBillingType() : BillingType.STANDARD;
        return BillResponse.from(bill, selector.strategyFor(type).description());
    }

    private Appointment findAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    private static BillingType parseType(String type) {
        try {
            return BillingType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid billing type: " + type + " (allowed: AUTO, STANDARD, EMERGENCY, FOLLOW_UP)");
        }
    }

    private static PaymentStatus parseStatus(String status) {
        try {
            return PaymentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment status: " + status);
        }
    }

    private static String label(PaymentStatus s) { return s.name().toLowerCase(Locale.ROOT); }
}
