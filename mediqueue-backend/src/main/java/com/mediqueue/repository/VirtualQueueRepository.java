package com.mediqueue.repository;
import com.mediqueue.entity.VirtualQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface VirtualQueueRepository extends JpaRepository<VirtualQueue, Long> {
    List<VirtualQueue> findByDoctor_UserIdAndQueueDateOrderByQueuePositionAsc(String doctorId, LocalDate date);
    int countByDoctor_UserIdAndQueueDate(String doctorId, LocalDate date);
}
