package com.mediqueue.service;

import com.mediqueue.dto.PrescriptionRequest;
import com.mediqueue.dto.PrescriptionResponse;

import java.util.List;

public interface PrescriptionService {
    PrescriptionResponse create(PrescriptionRequest request);
    List<PrescriptionResponse> getByDoctor(String doctorId);
}
