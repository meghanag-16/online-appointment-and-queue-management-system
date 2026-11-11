package com.mediqueue.service;

import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.PrescriptionResponse;
import java.util.List;

public interface PrescriptionService {
    /**
     * Only the appointment's own doctor. Completes the appointment, appends the diagnosis to the
     * patient's medical record and tells the patient a prescription is available.
     */
    PrescriptionResponse create(PrescriptionRequest request);

    List<PrescriptionResponse> getByDoctor(String doctorId);

    /** The patient, a doctor who treats them, or staff. Newest first. */
    List<PrescriptionResponse> getByPatient(String patientId);

    /** The prescription for one appointment (404 if none yet). */
    PrescriptionResponse getByAppointment(Long appointmentId);
}
