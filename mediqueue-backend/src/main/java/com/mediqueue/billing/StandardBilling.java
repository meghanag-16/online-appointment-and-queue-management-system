package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/**
 * StandardBilling — 100 % of doctor's consultation fee.
 */
@Component("standardBilling")
public class StandardBilling implements BillingStrategy {

    @Override
    public BigDecimal calculate(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor().getConsultationFee();
        return fee != null ? fee : BigDecimal.ZERO;
    }

    @Override
    public String strategyName() { return "STANDARD"; }
}
