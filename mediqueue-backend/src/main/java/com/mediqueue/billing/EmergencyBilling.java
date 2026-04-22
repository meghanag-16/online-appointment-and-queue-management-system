package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * EmergencyBilling — 150 % of consultation fee (emergency surcharge).
 */
@Component("emergencyBilling")
public class EmergencyBilling implements BillingStrategy {

    private static final BigDecimal MULTIPLIER = new BigDecimal("1.50");

    @Override
    public BigDecimal calculate(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor().getConsultationFee();
        if (fee == null) return BigDecimal.ZERO;
        return fee.multiply(MULTIPLIER).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String strategyName() { return "EMERGENCY"; }
}
