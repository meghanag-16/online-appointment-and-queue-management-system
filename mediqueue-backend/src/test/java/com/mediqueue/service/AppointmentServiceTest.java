package com.mediqueue.service;

import com.mediqueue.dto.AppointmentResponse;
import com.mediqueue.dto.BookAppointmentRequest;
import com.mediqueue.entity.*;
import com.mediqueue.entity.enums.*;
import com.mediqueue.exception.ResourceNotFoundException;
import com.mediqueue.exception.SlotUnavailableException;
import com.mediqueue.repository.*;
import com.mediqueue.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock PatientRepository     patientRepository;
    @Mock DoctorRepository      doctorRepository;
    @Mock TimeSlotRepository    timeSlotRepository;
    @Mock BillingService billingService;

    @InjectMocks AppointmentServiceImpl appointmentService;

    private Patient patient;
    private Doctor  doctor;
    private TimeSlot availableSlot;
    private Department department;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setDepartmentId("DEPT-01");
        department.setDepartmentName("Cardiology");

        patient = new Patient();
        patient.setUserId("PAT-001");
        patient.setName("Riya Nair");
        patient.setRole(UserRole.PATIENT);

        doctor = new Doctor();
        doctor.setUserId("DOC-001");
        doctor.setName("Dr. Venkat");
        doctor.setConsultationFee(BigDecimal.valueOf(500));
        doctor.setDepartment(department);

        availableSlot = new TimeSlot();
        availableSlot.setSlotId(1L);
        availableSlot.setDoctor(doctor);
        availableSlot.setStartTime(LocalDateTime.now().plusDays(1));
        availableSlot.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        availableSlot.setStatus(SlotStatus.AVAILABLE);
    }

    private BookAppointmentRequest makeRequest() {
        BookAppointmentRequest req = new BookAppointmentRequest();
        req.setPatientId("PAT-001");
        req.setDoctorId("DOC-001");
        req.setSlotId(1L);
        req.setAppointmentDate(LocalDate.now().plusDays(1));
        req.setReasonForVisit("Chest pain");
        req.setPriority("NORMAL");
        req.setCreatedByRole("PATIENT");
        return req;
    }

    // ── Booking success ───────────────────────────────────────────────────────

    @Test
    @DisplayName("bookAppointment: success — slot marked BOOKED, appointment saved")
    void bookAppointment_success() {
        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById("DOC-001")).thenReturn(Optional.of(doctor));
        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(availableSlot));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.bookAppointment(makeRequest());

        assertThat(response.getPatientId()).isEqualTo("PAT-001");
        assertThat(response.getDoctorId()).isEqualTo("DOC-001");
        assertThat(response.getStatus()).isEqualTo(AppointmentStatus.BOOKED);
        assertThat(availableSlot.getStatus()).isEqualTo(SlotStatus.BOOKED);
        verify(timeSlotRepository).save(availableSlot);
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("bookAppointment: patient not found throws ResourceNotFoundException")
    void bookAppointment_patientNotFound() {
        when(patientRepository.findById("PAT-001")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.bookAppointment(makeRequest()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Patient not found");
    }

    @Test
    @DisplayName("bookAppointment: doctor not found throws ResourceNotFoundException")
    void bookAppointment_doctorNotFound() {
        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById("DOC-001")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.bookAppointment(makeRequest()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Doctor not found");
    }

    // ── Slot unavailable + alternate suggestions ──────────────────────────────

    @Test
    @DisplayName("bookAppointment: booked slot throws SlotUnavailableException")
    void bookAppointment_slotAlreadyBooked_throws() {
        availableSlot.setStatus(SlotStatus.BOOKED);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById("DOC-001")).thenReturn(Optional.of(doctor));
        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(availableSlot));
        when(timeSlotRepository.findByDoctor_UserIdAndStatusAndStartTimeAfter(any(), any(), any()))
            .thenReturn(List.of());
        when(timeSlotRepository.findByDoctor_Department_DepartmentIdAndStatusAndStartTimeAfter(any(), any(), any()))
            .thenReturn(List.of());

        assertThatThrownBy(() -> appointmentService.bookAppointment(makeRequest()))
            .isInstanceOf(SlotUnavailableException.class)
            .hasMessageContaining("not available");
    }

    @Test
    @DisplayName("bookAppointment: alternate same-doctor slots returned on unavailability")
    void bookAppointment_suggestsAlternateSlots() {
        availableSlot.setStatus(SlotStatus.BOOKED);

        TimeSlot altSlot = new TimeSlot();
        altSlot.setSlotId(2L);
        altSlot.setDoctor(doctor);
        altSlot.setStartTime(LocalDateTime.now().plusDays(2));
        altSlot.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        altSlot.setStatus(SlotStatus.AVAILABLE);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById("DOC-001")).thenReturn(Optional.of(doctor));
        when(timeSlotRepository.findById(1L)).thenReturn(Optional.of(availableSlot));
        when(timeSlotRepository.findByDoctor_UserIdAndStatusAndStartTimeAfter(any(), any(), any()))
            .thenReturn(List.of(altSlot));
        when(timeSlotRepository.findByDoctor_Department_DepartmentIdAndStatusAndStartTimeAfter(any(), any(), any()))
            .thenReturn(List.of());

        // should throw but alternate slots exist in the message
        assertThatThrownBy(() -> appointmentService.bookAppointment(makeRequest()))
            .isInstanceOf(SlotUnavailableException.class)
            .hasMessageContaining("1 alternate(s) suggested");
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelAppointment: sets status CANCELLED and frees slot")
    void cancelAppointment_success() {
        Appointment a = new Appointment();
        a.setAppointmentId(99L);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setSlot(availableSlot);
        availableSlot.setStatus(SlotStatus.BOOKED);
        a.setAppointmentStatus(AppointmentStatus.BOOKED);

        when(appointmentRepository.findById(99L)).thenReturn(Optional.of(a));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse resp = appointmentService.cancelAppointment(99L);

        assertThat(resp.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(availableSlot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
    }
}
