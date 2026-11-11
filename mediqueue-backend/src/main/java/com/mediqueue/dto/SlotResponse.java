package com.mediqueue.dto;

import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.SlotStatus;
import java.time.LocalDateTime;

public record SlotResponse(
        Long slotId, LocalDateTime startTime, LocalDateTime endTime, SlotStatus status) {
    public static SlotResponse from(TimeSlot s) {
        return new SlotResponse(s.getSlotId(), s.getStartTime(), s.getEndTime(), s.getStatus());
    }
}
