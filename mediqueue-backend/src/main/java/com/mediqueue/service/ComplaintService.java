package com.mediqueue.service;

import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;

import java.util.List;

public interface ComplaintService {
    ComplaintResponse raise(ComplaintRequest request);
    List<ComplaintResponse> getAll();
    ComplaintResponse resolve(String complaintId, String resolution);
}
