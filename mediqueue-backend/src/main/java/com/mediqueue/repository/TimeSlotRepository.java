package com.mediqueue.repository;

import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.AccountStatus;
import com.mediqueue.entity.enums.SlotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    /**
     * Loads a slot with a row lock (SELECT ... FOR UPDATE) for the rest of the transaction, so two
     * people booking the same slot at the same moment are serialised: the second one sees BOOKED.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TimeSlot s where s.slotId = :slotId")
    Optional<TimeSlot> findByIdForUpdate(@Param("slotId") Long slotId);

    // ── open slots for booking ──────────────────────────────────────────────
    List<TimeSlot> findByDoctor_UserIdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
        String doctorId, SlotStatus status, LocalDateTime after);

    List<TimeSlot> findByDoctor_UserIdAndStatusAndStartTimeBetweenOrderByStartTimeAsc(
        String doctorId, SlotStatus status, LocalDateTime from, LocalDateTime to);

    /** Alternate suggestions: the same doctor's next open slots. */
    List<TimeSlot> findTop3ByDoctor_UserIdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
        String doctorId, SlotStatus status, LocalDateTime after);

    /** Alternate suggestions: other active doctors in the same department. */
    List<TimeSlot> findTop3ByDoctor_Department_DepartmentIdAndDoctor_UserIdNotAndDoctor_AccountStatusAndStatusAndStartTimeAfterOrderByStartTimeAsc(
        String departmentId, String excludeDoctorId, AccountStatus doctorStatus, SlotStatus status, LocalDateTime after);

    // ── doctor search: availability ─────────────────────────────────────────
    /** [doctorId, earliest open slot start] for every doctor with an open slot in the range. */
    @Query("""
        select s.doctor.userId, min(s.startTime) from TimeSlot s
        where s.status = :status and s.startTime > :after and s.startTime < :before
        group by s.doctor.userId
        """)
    List<Object[]> earliestOpenSlotPerDoctor(@Param("status") SlotStatus status,
                                             @Param("after") LocalDateTime after,
                                             @Param("before") LocalDateTime before);

    // ── slot generation ─────────────────────────────────────────────────────
    /** A doctor's live (not withdrawn) slots overlapping a time range; used to avoid overlaps. */
    List<TimeSlot> findByDoctor_UserIdAndStatusNotAndEndTimeGreaterThanAndStartTimeLessThan(
        String doctorId, SlotStatus excludedStatus, LocalDateTime rangeStart, LocalDateTime rangeEnd);

    /** Deletes open future slots no appointment has ever pointed at (doctorId null = all doctors). */
    @Modifying(flushAutomatically = true)
    @Query("""
        delete from TimeSlot s
        where s.status = :open and s.startTime > :after
          and (:doctorId is null or s.doctor.userId = :doctorId)
          and not exists (select a.appointmentId from Appointment a where a.slot = s)
        """)
    int deleteUnusedOpenSlots(@Param("doctorId") String doctorId,
                              @Param("after") LocalDateTime after,
                              @Param("open") SlotStatus open);

    /** Withdraws the remaining open future slots (kept because a cancelled appointment points at them). */
    @Modifying(flushAutomatically = true)
    @Query("""
        update TimeSlot s set s.status = :withdrawn
        where s.status = :open and s.startTime > :after
          and (:doctorId is null or s.doctor.userId = :doctorId)
        """)
    int withdrawOpenSlots(@Param("doctorId") String doctorId,
                          @Param("after") LocalDateTime after,
                          @Param("open") SlotStatus open,
                          @Param("withdrawn") SlotStatus withdrawn);
}
