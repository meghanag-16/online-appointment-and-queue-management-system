package com.mediqueue.repository;
import com.mediqueue.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    List<Complaint> findByPatient_UserId(String patientId);
}
