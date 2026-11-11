package com.mediqueue.service;

import com.mediqueue.dto.DoctorDTO;
import com.mediqueue.dto.DoctorDashboardResponse;
import com.mediqueue.dto.QueueEntryResponse;
import com.mediqueue.dto.SlotResponse;

import java.util.List;

public interface DoctorService {
    List<SlotResponse> getAvailableSlots(String doctorId);
    List<DoctorDTO> searchDoctors(String query);
    DoctorDashboardResponse getDashboard(String doctorId);
    List<QueueEntryResponse> getTodayQueue(String doctorId);
}
