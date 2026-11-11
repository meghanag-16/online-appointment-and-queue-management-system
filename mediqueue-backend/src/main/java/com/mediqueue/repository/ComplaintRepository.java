package com.mediqueue.repository;

import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.enums.ResolutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    List<Complaint> findByPatient_UserId(String patientId);
    long countByResolutionStatusIn(Collection<ResolutionStatus> statuses);
    long countByPatient_UserIdAndResolutionStatusIn(String patientId, Collection<ResolutionStatus> statuses);
}
