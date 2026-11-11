package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.BillingType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

/** EmergencyBilling — 150 % of the consultation fee, used for high-priority visits. */
@Component
public class EmergencyBilling implements BillingStrategy {

    private static final BigDecimal MULTIPLIER = new BigDecimal("1.50");

    @Override
    public BillingType type() {
        return BillingType.EMERGENCY;
    }

    @Override
    public BigDecimal calculate(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor().getConsultationFee();
        if (fee == null) return BigDecimal.ZERO.setScale(2);
        return fee.multiply(MULTIPLIER).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String description() {
        return "Emergency (high priority): 150% of the consultation fee";
    }
}
