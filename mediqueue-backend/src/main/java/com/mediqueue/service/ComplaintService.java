package com.mediqueue.service;

import com.mediqueue.dto.ComplaintRequest;
import com.mediqueue.dto.ComplaintResponse;
import com.mediqueue.dto.ComplaintStatusRequest;
import java.util.List;

public interface ComplaintService {
    ComplaintResponse raise(ComplaintRequest request);

    /** The logged-in patient's complaints, newest first. */
    List<ComplaintResponse> getMine();

    /** Administrator: all complaints, or only those in one status. */
    List<ComplaintResponse> getAll(String status);

    /** Administrator: OPEN → UNDER_REVIEW → RESOLVED (a note is required to resolve). */
    ComplaintResponse updateStatus(String complaintId, ComplaintStatusRequest request);
}
