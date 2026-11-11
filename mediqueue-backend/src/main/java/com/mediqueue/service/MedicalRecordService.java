package com.mediqueue.service;

import com.mediqueue.entity.MedicalRecord;
import com.mediqueue.entity.Patient;
import com.mediqueue.entity.Prescription;

/** Every patient has exactly one medical record; consultations are appended to it. */
public interface MedicalRecordService {

    /** Returns the patient's record, creating an empty one if it does not exist yet. */
    MedicalRecord ensureRecord(Patient patient);

    /** Creates missing records for all patients (patients added before records existed). Returns how many. */
    int createMissingRecords();

    /** Adds a dated line to the record's diagnoses (and medications/advice to observations). */
    void appendConsultation(Prescription prescription);
}
