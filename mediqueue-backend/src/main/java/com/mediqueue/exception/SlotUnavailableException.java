package com.mediqueue.exception;

import com.mediqueue.dto.AppointmentResponse.AlternateSlot;

import java.util.List;

/** The chosen slot cannot be booked; carries suggested alternates for the error body (HTTP 409). */
public class SlotUnavailableException extends RuntimeException {

    private final transient List<AlternateSlot> alternateSlots;

    public SlotUnavailableException(String message, List<AlternateSlot> alternateSlots) {
        super(message);
        this.alternateSlots = alternateSlots == null ? List.of() : List.copyOf(alternateSlots);
    }

    public List<AlternateSlot> getAlternateSlots() { return alternateSlots; }
}
