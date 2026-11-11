package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.BillingType;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.repository.PrescriptionRepository;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Chooses the pricing rule for an appointment:
 *  - EMERGENCY when the appointment is high priority;
 *  - FOLLOW_UP when the same doctor asked for a follow-up at an earlier visit and this visit is
 *    no more than {@value #FOLLOW_UP_GRACE_DAYS} days after the follow-up date they set;
 *  - STANDARD otherwise.
 * Stateless: nothing is stored between calls.
 */
@Component
public class BillingStrategySelector {

    public static final int FOLLOW_UP_GRACE_DAYS = 7;

    private final Map<BillingType, BillingStrategy> strategies = new EnumMap<>(BillingType.class);
    private final PrescriptionRepository prescriptionRepository;

    public BillingStrategySelector(List<BillingStrategy> all, PrescriptionRepository prescriptionRepository) {
        all.forEach(s -> strategies.put(s.type(), s));
        this.prescriptionRepository = prescriptionRepository;
    }

    public BillingStrategy select(Appointment appointment) {
        return strategyFor(chooseType(appointment.getPriority(), isFollowUp(appointment)));
    }

    public BillingStrategy strategyFor(BillingType type) {
        BillingStrategy s = strategies.get(type);
        if (s == null) throw new IllegalStateException("No billing strategy for " + type);
        return s;
    }

    /** The rule itself, separated out so it can be tested without a database. */
    public static BillingType chooseType(Priority priority, boolean followUpVisit) {
        if (priority == Priority.HIGH_PRIORITY) return BillingType.EMERGENCY;
        if (followUpVisit) return BillingType.FOLLOW_UP;
        return BillingType.STANDARD;
    }

    private boolean isFollowUp(Appointment a) {
        if (a.getAppointmentDate() == null || a.getPatient() == null || a.getDoctor() == null) return false;
        return prescriptionRepository.isFollowUpVisit(a.getPatient().getUserId(), a.getDoctor().getUserId(),
            a.getAppointmentId(), a.getAppointmentDate(), a.getAppointmentDate().minusDays(FOLLOW_UP_GRACE_DAYS));
    }
}
