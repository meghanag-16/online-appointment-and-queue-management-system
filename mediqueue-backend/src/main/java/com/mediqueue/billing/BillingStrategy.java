package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import java.math.BigDecimal;

/**
 * BillingStrategy — Strategy pattern interface.
 * Each concrete strategy implements a different billing calculation rule.
 */
public interface BillingStrategy {
    BigDecimal calculate(Appointment appointment);
    String strategyName();
}
