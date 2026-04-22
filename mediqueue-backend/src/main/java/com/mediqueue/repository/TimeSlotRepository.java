package com.mediqueue.repository;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByDoctor_UserIdAndStatusAndStartTimeAfter(
        String doctorId, SlotStatus status, LocalDateTime after);
    List<TimeSlot> findByDoctor_Department_DepartmentIdAndStatusAndStartTimeAfter(
        String departmentId, SlotStatus status, LocalDateTime after);
}
