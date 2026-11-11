package com.mediqueue.util;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Shared wording for notifications and audit entries ("Dr. Name", "Thu 12 Nov 2026 at 9:30 AM").
 */
public final class DisplayText {

    public static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("EEE d MMM yyyy 'at' h:mm a", Locale.ENGLISH);

    private DisplayText() {}

    /** "Dr. Name", without doubling the title when the stored name already has it. */
    public static String doctor(Doctor d) {
        String name = d.getName() == null ? "" : d.getName().trim();
        return name.matches("(?i)^dr\\.?\\s.*") ? name : "Dr. " + name;
    }

    /** The appointment's slot start, or its date when it has no slot. */
    public static String when(Appointment a) {
        LocalDateTime start = a.getSlot() != null ? a.getSlot().getStartTime() : null;
        return start != null ? WHEN.format(start) : String.valueOf(a.getAppointmentDate());
    }
}
