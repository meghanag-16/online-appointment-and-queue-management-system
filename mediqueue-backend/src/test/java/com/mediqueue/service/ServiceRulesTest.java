package com.mediqueue.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mediqueue.audit.AuditService;
import com.mediqueue.billing.BillingStrategySelector;
import com.mediqueue.dto.LoginRequest;
import com.mediqueue.dto.PaymentUpdateRequest;
import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.SlotSettingsDTO;
import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Bill;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.entity.enums.PaymentStatus;
import com.mediqueue.entity.enums.UserRole;
import com.mediqueue.exception.AccountInactiveException;
import com.mediqueue.exception.BadRequestException;
import com.mediqueue.exception.DuplicateResourceException;
import com.mediqueue.exception.ForbiddenException;
import com.mediqueue.exception.UnauthorizedException;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.repository.BillRepository;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.PrescriptionRepository;
import com.mediqueue.repository.SlotSettingsRepository;
import com.mediqueue.repository.TimeSlotRepository;
import com.mediqueue.repository.UserRepository;
import com.mediqueue.security.AccessGuard;
import com.mediqueue.security.JwtUtil;
import com.mediqueue.service.facade.NotificationFacade;
import com.mediqueue.service.impl.AuthServiceImpl;
import com.mediqueue.service.impl.BillingServiceImpl;
import com.mediqueue.service.impl.PrescriptionServiceImpl;
import com.mediqueue.service.impl.SlotServiceImpl;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** Business rules of the main services, with every dependency mocked (no database). */
class ServiceRulesTest {

    // ── login ────────────────────────────────────────────────────────────────

    @Nested
    class Login {
        private final UserRepository users = mock(UserRepository.class);
        private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        private final AuthServiceImpl auth =
                new AuthServiceImpl(users, mock(UserAccountService.class), encoder, jwt());

        private Patient patient(AccountStatus status) {
            Patient p = new Patient();
            p.setUserId("PAT-1");
            p.setUsername("riya");
            p.setPassword(encoder.encode("Secret@123"));
            p.setRole(UserRole.PATIENT);
            p.setAccountStatus(status);
            return p;
        }

        private LoginRequest request(String password) {
            LoginRequest r = new LoginRequest();
            r.setUsername("riya");
            r.setPassword(password);
            return r;
        }

        @Test
        void correctPasswordGivesAToken() {
            when(users.findByUsername("riya"))
                    .thenReturn(Optional.of(patient(AccountStatus.ACTIVE)));
            assertNotNull(auth.login(request("Secret@123")).getToken());
        }

        @Test
        void wrongPasswordOrUnknownUserIsRejected() {
            when(users.findByUsername("riya"))
                    .thenReturn(Optional.of(patient(AccountStatus.ACTIVE)));
            assertThrows(UnauthorizedException.class, () -> auth.login(request("wrong")));
            when(users.findByUsername("riya")).thenReturn(Optional.empty());
            assertThrows(UnauthorizedException.class, () -> auth.login(request("Secret@123")));
        }

        @Test
        void suspendedOrDeactivatedAccountsCannotLogIn() {
            when(users.findByUsername("riya"))
                    .thenReturn(Optional.of(patient(AccountStatus.SUSPENDED)));
            assertThrows(AccountInactiveException.class, () -> auth.login(request("Secret@123")));
        }
    }

    // ── JWT ──────────────────────────────────────────────────────────────────

    @Test
    void jwtRoundTripAndShortSecretIsRefused() {
        JwtUtil util = jwt();
        String token = util.generateToken("riya", "PATIENT");
        assertTrue(util.validateToken(token));
        assertEquals("riya", util.extractUsername(token));
        assertEquals("PATIENT", util.extractRole(token));
        assertTrue(!util.validateToken(token + "x"));

        JwtUtil weak = new JwtUtil();
        ReflectionTestUtils.setField(weak, "secret", "too-short");
        assertThrows(
                IllegalStateException.class,
                () -> ReflectionTestUtils.invokeMethod(weak, "validateSecret"));
    }

    private static JwtUtil jwt() {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", "unit-test-secret-key-at-least-32-characters");
        return util;
    }

    // ── billing ──────────────────────────────────────────────────────────────

    @Nested
    class Billing {
        private final BillRepository bills = mock(BillRepository.class);
        private final BillingServiceImpl billing =
                new BillingServiceImpl(
                        bills,
                        mock(AppointmentRepository.class),
                        new BillingStrategySelector(
                                java.util.List.of(
                                        new com.mediqueue.billing.StandardBilling(),
                                        new com.mediqueue.billing.EmergencyBilling(),
                                        new com.mediqueue.billing.FollowUpBilling()),
                                mock(PrescriptionRepository.class)),
                        mock(AccessGuard.class),
                        mock(AuditService.class));

        private Bill bill(PaymentStatus status) {
            Appointment a = new Appointment();
            a.setAppointmentId(10L);
            a.setPatient(new Patient());
            Doctor d = new Doctor();
            d.setName("Dr. Test");
            a.setDoctor(d);
            Bill b = new Bill();
            b.setBillId(5L);
            b.setAppointment(a);
            b.setTotalAmount(new BigDecimal("500.00"));
            b.setPaymentStatus(status);
            when(bills.findById(5L)).thenReturn(Optional.of(b));
            when(bills.save(any(Bill.class))).thenAnswer(i -> i.getArgument(0));
            return b;
        }

        private PaymentUpdateRequest payment(String status, String method) {
            PaymentUpdateRequest r = new PaymentUpdateRequest();
            r.setPaymentStatus(status);
            r.setPaymentMethod(method);
            return r;
        }

        @Test
        void markingPaidNeedsAPaymentMethod() {
            bill(PaymentStatus.PENDING);
            assertThrows(
                    BadRequestException.class,
                    () -> billing.updatePaymentStatus(5L, payment("PAID", null)));
            assertEquals(
                    PaymentStatus.PAID,
                    billing.updatePaymentStatus(5L, payment("PAID", "upi")).getPaymentStatus());
        }

        @Test
        void closedBillsCannotChange() {
            bill(PaymentStatus.VOID);
            assertThrows(
                    BadRequestException.class,
                    () -> billing.updatePaymentStatus(5L, payment("PAID", "CASH")));
        }

        @Test
        void paidBillCanBeRefunded() {
            bill(PaymentStatus.PAID);
            assertEquals(
                    PaymentStatus.REFUNDED,
                    billing.updatePaymentStatus(5L, payment("REFUNDED", null)).getPaymentStatus());
        }

        @Test
        void cancellingVoidsAnUnpaidBillAndRefundsAPaidOne() {
            Bill pending = bill(PaymentStatus.PENDING);
            when(bills.findByAppointment_AppointmentId(10L)).thenReturn(Optional.of(pending));
            billing.settleCancelledAppointment(10L);
            assertEquals(PaymentStatus.VOID, pending.getPaymentStatus());

            Bill paid = bill(PaymentStatus.PAID);
            when(bills.findByAppointment_AppointmentId(10L)).thenReturn(Optional.of(paid));
            billing.settleCancelledAppointment(10L);
            assertEquals(PaymentStatus.REFUNDED, paid.getPaymentStatus());
        }
    }

    // ── prescriptions ────────────────────────────────────────────────────────

    @Nested
    class Prescriptions {
        private final PrescriptionRepository prescriptions = mock(PrescriptionRepository.class);
        private final AppointmentRepository appointments = mock(AppointmentRepository.class);
        private final AccessGuard guard = mock(AccessGuard.class);
        private final AppointmentService appointmentService = mock(AppointmentService.class);
        private final PrescriptionServiceImpl service =
                new PrescriptionServiceImpl(
                        prescriptions,
                        appointments,
                        appointmentService,
                        mock(MedicalRecordService.class),
                        mock(NotificationFacade.class),
                        guard);

        private Appointment appointment(AppointmentStatus status, LocalDate day) {
            Appointment a = new Appointment();
            a.setAppointmentId(7L);
            a.setAppointmentStatus(status);
            a.setAppointmentDate(day);
            when(appointments.findById(7L)).thenReturn(Optional.of(a));
            return a;
        }

        private final PrescriptionRequest request =
                new PrescriptionRequest(7L, "Fever", "Paracetamol", null, null);

        @Test
        void onlyTheTreatingDoctorCanPrescribe() {
            Appointment a = appointment(AppointmentStatus.IN_PROGRESS, LocalDate.now());
            doThrow(new ForbiddenException("no")).when(guard).requireTreatingDoctor(a);
            assertThrows(ForbiddenException.class, () -> service.create(request));
            verify(prescriptions, never()).saveAndFlush(any());
        }

        @Test
        void noPrescriptionForCancelledFutureOrAlreadyPrescribedVisits() {
            appointment(AppointmentStatus.CANCELLED, LocalDate.now());
            assertThrows(BadRequestException.class, () -> service.create(request));

            appointment(AppointmentStatus.BOOKED, LocalDate.now().plusDays(2));
            assertThrows(BadRequestException.class, () -> service.create(request));

            appointment(AppointmentStatus.IN_PROGRESS, LocalDate.now());
            when(prescriptions.existsByAppointment_AppointmentId(7L)).thenReturn(true);
            assertThrows(DuplicateResourceException.class, () -> service.create(request));
        }

        @Test
        void followUpDateMustBeInTheFuture() {
            appointment(AppointmentStatus.IN_PROGRESS, LocalDate.now());
            PrescriptionRequest past =
                    new PrescriptionRequest(7L, "Fever", "Paracetamol", null, LocalDate.now());
            assertThrows(BadRequestException.class, () -> service.create(past));
        }
    }

    // ── slot settings ────────────────────────────────────────────────────────

    @Nested
    class SlotSettingsRules {
        private final SlotServiceImpl slots =
                new SlotServiceImpl(
                        mock(SlotSettingsRepository.class),
                        mock(TimeSlotRepository.class),
                        mock(DoctorRepository.class));

        private SlotSettingsDTO settings(
                int minutes, String start, String end, String breakStart, String breakEnd) {
            return new SlotSettingsDTO(
                    minutes,
                    LocalTime.parse(start),
                    LocalTime.parse(end),
                    breakStart == null ? null : LocalTime.parse(breakStart),
                    breakEnd == null ? null : LocalTime.parse(breakEnd),
                    EnumSet.of(DayOfWeek.MONDAY),
                    7,
                    2);
        }

        @Test
        void invalidHoursAreRejected() {
            assertThrows(
                    BadRequestException.class,
                    () -> slots.updateSettings(settings(30, "17:00", "09:00", null, null)));
            assertThrows(
                    BadRequestException.class,
                    () -> slots.updateSettings(settings(30, "09:00", "17:00", "13:00", null)));
            assertThrows(
                    BadRequestException.class,
                    () -> slots.updateSettings(settings(30, "09:00", "17:00", "08:00", "10:00")));
            assertThrows(
                    BadRequestException.class,
                    () -> slots.updateSettings(settings(120, "09:00", "10:00", null, null)));
        }
    }
}
