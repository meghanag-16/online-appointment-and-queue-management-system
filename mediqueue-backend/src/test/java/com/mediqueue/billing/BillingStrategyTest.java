package com.mediqueue.billing;

import com.mediqueue.dto.BillResponse;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.service.impl.BillingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingStrategyTest {

    // ── Pure strategy unit tests (no Spring context needed) ───────────────────

    @Nested
    @DisplayName("StandardBilling")
    class StandardBillingTests {
        private final StandardBilling billing = new StandardBilling();

        @Test
        @DisplayName("returns 100% of consultation fee")
        void standardBilling_fullFee() {
            Appointment a = appointmentWithFee("500.00");
            assertThat(billing.calculate(a)).isEqualByComparingTo("500.00");
        }

        @Test
        @DisplayName("returns zero when fee is null")
        void standardBilling_nullFee() {
            Appointment a = appointmentWithFee(null);
            assertThat(billing.calculate(a)).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("strategyName returns STANDARD")
        void standardBilling_name() {
            assertThat(billing.strategyName()).isEqualTo("STANDARD");
        }
    }

    @Nested
    @DisplayName("EmergencyBilling")
    class EmergencyBillingTests {
        private final EmergencyBilling billing = new EmergencyBilling();

        @Test
        @DisplayName("returns 150% of consultation fee")
        void emergencyBilling_surcharge() {
            Appointment a = appointmentWithFee("500.00");
            assertThat(billing.calculate(a)).isEqualByComparingTo("750.00");
        }

        @Test
        @DisplayName("returns zero when fee is null")
        void emergencyBilling_nullFee() {
            Appointment a = appointmentWithFee(null);
            assertThat(billing.calculate(a)).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("rounds to 2 decimal places")
        void emergencyBilling_rounding() {
            Appointment a = appointmentWithFee("333.33");
            BigDecimal result = billing.calculate(a);
            assertThat(result.scale()).isEqualTo(2);
            assertThat(result).isEqualByComparingTo("500.00"); // 333.33 * 1.5 = 499.995 → 500.00 half-up
        }

        @Test
        @DisplayName("strategyName returns EMERGENCY")
        void emergencyBilling_name() {
            assertThat(billing.strategyName()).isEqualTo("EMERGENCY");
        }
    }

    @Nested
    @DisplayName("FollowUpBilling")
    class FollowUpBillingTests {
        private final FollowUpBilling billing = new FollowUpBilling();

        @Test
        @DisplayName("returns 50% of consultation fee")
        void followUpBilling_halfFee() {
            Appointment a = appointmentWithFee("500.00");
            assertThat(billing.calculate(a)).isEqualByComparingTo("250.00");
        }

        @Test
        @DisplayName("returns zero when fee is null")
        void followUpBilling_nullFee() {
            Appointment a = appointmentWithFee(null);
            assertThat(billing.calculate(a)).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("strategyName returns FOLLOW_UP")
        void followUpBilling_name() {
            assertThat(billing.strategyName()).isEqualTo("FOLLOW_UP");
        }
    }

    @Nested
    @DisplayName("BillingContext")
    class BillingContextTests {

        @Test
        @DisplayName("delegates to the set strategy")
        void context_delegatesToStrategy() {
            BillingContext ctx = new BillingContext();
            ctx.setStrategy(new StandardBilling());
            Appointment a = appointmentWithFee("600.00");
            assertThat(ctx.executeStrategy(a)).isEqualByComparingTo("600.00");
        }

        @Test
        @DisplayName("throws when no strategy set")
        void context_noStrategy_throws() {
            BillingContext ctx = new BillingContext();
            assertThatThrownBy(() -> ctx.executeStrategy(appointmentWithFee("100")))
                .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("strategy can be swapped at runtime")
        void context_strategySwap() {
            BillingContext ctx = new BillingContext();
            Appointment a = appointmentWithFee("400.00");

            ctx.setStrategy(new StandardBilling());
            assertThat(ctx.executeStrategy(a)).isEqualByComparingTo("400.00");

            ctx.setStrategy(new EmergencyBilling());
            assertThat(ctx.executeStrategy(a)).isEqualByComparingTo("600.00");

            ctx.setStrategy(new FollowUpBilling());
            assertThat(ctx.executeStrategy(a)).isEqualByComparingTo("200.00");
        }
    }

    // ── BillingService integration with mocks ─────────────────────────────────

    @Nested
    @DisplayName("BillingService")
    @ExtendWith(MockitoExtension.class)
    class BillingServiceTests {

        @Mock BillRepository billRepository;
        @Mock AppointmentRepository appointmentRepository;

        private BillingServiceImpl billingService;
        private Appointment appointment;

        @BeforeEach
        void setUp() {
            StandardBilling std = new StandardBilling();
            EmergencyBilling emg = new EmergencyBilling();
            FollowUpBilling flw = new FollowUpBilling();
            BillingContext ctx = new BillingContext();

            billingService = new BillingServiceImpl(
                billRepository, appointmentRepository, std, emg, flw, ctx);

            appointment = appointmentWithFee("500.00");
            appointment.setAppointmentId(1L);
        }

        @Test
        @DisplayName("generateBill: standard strategy produces correct amount")
        void generateBill_standard() {
            when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
            when(billRepository.findByAppointment_AppointmentId(1L)).thenReturn(Optional.empty());
            when(billRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            BillResponse resp = billingService.generateBill(1L, "STANDARD");

            assertThat(resp.getTotalAmount()).isEqualByComparingTo("500.00");
            assertThat(resp.getBillingStrategy()).isEqualTo("STANDARD");
        }

        @Test
        @DisplayName("generateBill: emergency strategy adds 50% surcharge")
        void generateBill_emergency() {
            when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
            when(billRepository.findByAppointment_AppointmentId(1L)).thenReturn(Optional.empty());
            when(billRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            BillResponse resp = billingService.generateBill(1L, "EMERGENCY");

            assertThat(resp.getTotalAmount()).isEqualByComparingTo("750.00");
        }

        @Test
        @DisplayName("generateBill: follow-up strategy halves fee")
        void generateBill_followUp() {
            when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
            when(billRepository.findByAppointment_AppointmentId(1L)).thenReturn(Optional.empty());
            when(billRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            BillResponse resp = billingService.generateBill(1L, "FOLLOW_UP");

            assertThat(resp.getTotalAmount()).isEqualByComparingTo("250.00");
        }

        @Test
        @DisplayName("updatePaymentStatus: marks bill as PAID")
        void updatePayment_paid() {
            Bill bill = new Bill();
            bill.setBillId(10L);
            bill.setTotalAmount(BigDecimal.valueOf(500));
            bill.setPaymentStatus(PaymentStatus.PENDING);

            when(billRepository.findById(10L)).thenReturn(Optional.of(bill));
            when(billRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PaymentUpdateRequest req = new PaymentUpdateRequest();
            req.setPaymentStatus("PAID");
            req.setPaymentMethod("UPI");

            BillResponse resp = billingService.updatePaymentStatus(10L, req);

            assertThat(resp.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
            assertThat(resp.getPaymentMethod()).isEqualTo("UPI");
        }

        @Test
        @DisplayName("getBill: throws ResourceNotFoundException for unknown appointment")
        void getBill_notFound() {
            when(billRepository.findByAppointment_AppointmentId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> billingService.getBill(999L))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static Appointment appointmentWithFee(String feeStr) {
        Doctor doctor = new Doctor();
        doctor.setUserId("DOC-TEST");
        doctor.setConsultationFee(feeStr != null ? new BigDecimal(feeStr) : null);

        Appointment a = new Appointment();
        a.setDoctor(doctor);
        return a;
    }
}
