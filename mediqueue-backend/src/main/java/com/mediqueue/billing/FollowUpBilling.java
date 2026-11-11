package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.BillingType;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;

/** FollowUpBilling — 50 % of the consultation fee for a follow-up visit the doctor asked for. */
@Component
public class FollowUpBilling implements BillingStrategy {

    private static final BigDecimal MULTIPLIER = new BigDecimal("0.50");

    @Override
    public BillingType type() { return BillingType.FOLLOW_UP; }

    @Override
    public BigDecimal calculate(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor().getConsultationFee();
        if (fee == null) return BigDecimal.ZERO.setScale(2);
        return fee.multiply(MULTIPLIER).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String description() { return "Follow-up visit: 50% of the consultation fee"; }
}
