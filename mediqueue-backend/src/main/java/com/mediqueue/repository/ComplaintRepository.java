package com.mediqueue.repository;

import com.mediqueue.entity.Complaint;
import com.mediqueue.entity.enums.ResolutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    List<Complaint> findByPatient_UserIdOrderByCreatedOnDescUpdatedAtDesc(String patientId);
    List<Complaint> findAllByOrderByCreatedOnDescUpdatedAtDesc();
    List<Complaint> findByResolutionStatusOrderByCreatedOnDescUpdatedAtDesc(ResolutionStatus status);
    long countByResolutionStatusIn(Collection<ResolutionStatus> statuses);
    long countByPatient_UserIdAndResolutionStatusIn(String patientId, Collection<ResolutionStatus> statuses);
}
