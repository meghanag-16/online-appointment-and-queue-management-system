package com.mediqueue.billing;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.enums.BillingType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

/** StandardBilling — 100 % of the doctor's consultation fee. */
@Component
public class StandardBilling implements BillingStrategy {

    @Override
    public BillingType type() {
        return BillingType.STANDARD;
    }

    @Override
    public BigDecimal calculate(Appointment appointment) {
        BigDecimal fee = appointment.getDoctor().getConsultationFee();
        return fee != null ? fee.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
    }

    @Override
    public String description() {
        return "Standard consultation fee";
    }
}
