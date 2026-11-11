package com.mediqueue.service;

import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorDashboardResponse;
import com.mediqueue.dto.SlotResponse;
import java.time.LocalDate;
import java.util.List;

public interface DoctorService {
    /** Open future slots of an active doctor, optionally only on one date. */
    List<SlotResponse> getAvailableSlots(String doctorId, LocalDate date);

    /**
     * Active doctors matching the text (name, specialization, qualification, department), the
     * department and, if a date is given, having at least one open slot that day.
     */
    List<DoctorDTO> searchDoctors(String query, String departmentId, LocalDate date);

    DoctorDashboardResponse getDashboard(String doctorId);
}
