package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.BillingType;
import java.math.BigDecimal;

/**
 * Strategy pattern: each pricing rule is one stateless implementation. The rule for an appointment
 * is picked by {@link BillingStrategySelector} and passed in, so two bills worked out at the same
 * time can never pick up each other's rule.
 */
public interface BillingStrategy {
    BillingType type();
    BigDecimal calculate(Appointment appointment);
    /** Short explanation shown on the bill, e.g. "150% of the consultation fee". */
    String description();
}
