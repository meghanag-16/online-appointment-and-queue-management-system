package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/**
 * BillingContext — holds and delegates to the active BillingStrategy.
 */
@Component
public class BillingContext {

    private BillingStrategy strategy;

    public void setStrategy(BillingStrategy strategy) {
        this.strategy = strategy;
    }

    public BigDecimal executeStrategy(Appointment appointment) {
        if (strategy == null) {
            throw new IllegalStateException("No billing strategy set");
        }
        return strategy.calculate(appointment);
    }

    public String currentStrategyName() {
        return strategy != null ? strategy.strategyName() : "NONE";
    }
}
