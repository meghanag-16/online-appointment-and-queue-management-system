package com.mediqueue.billing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.mediqueue.entity.Appointment;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.enums.BillingType;
import com.mediqueue.entity.enums.Priority;
import com.mediqueue.repository.PrescriptionRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Which pricing rule is chosen, and what each rule charges. */
class BillingStrategyTest {

    private static Appointment withFee(String fee) {
        Doctor d = new Doctor();
        d.setConsultationFee(fee == null ? null : new BigDecimal(fee));
        Appointment a = new Appointment();
        a.setDoctor(d);
        return a;
    }

    @Test
    void highPriorityIsAlwaysEmergency() {
        assertEquals(
                BillingType.EMERGENCY,
                BillingStrategySelector.chooseType(Priority.HIGH_PRIORITY, false));
        assertEquals(
                BillingType.EMERGENCY,
                BillingStrategySelector.chooseType(Priority.HIGH_PRIORITY, true));
    }

    @Test
    void followUpVisitIsFollowUpOtherwiseStandard() {
        assertEquals(
                BillingType.FOLLOW_UP, BillingStrategySelector.chooseType(Priority.NORMAL, true));
        assertEquals(
                BillingType.STANDARD, BillingStrategySelector.chooseType(Priority.NORMAL, false));
        assertEquals(BillingType.STANDARD, BillingStrategySelector.chooseType(null, false));
    }

    @Test
    void strategiesChargeTheRightShareOfTheFee() {
        Appointment a = withFee("500");
        assertEquals(new BigDecimal("500.00"), new StandardBilling().calculate(a));
        assertEquals(new BigDecimal("750.00"), new EmergencyBilling().calculate(a));
        assertEquals(new BigDecimal("250.00"), new FollowUpBilling().calculate(a));
    }

    @Test
    void missingFeeChargesNothing() {
        Appointment a = withFee(null);
        assertEquals(0, new StandardBilling().calculate(a).signum());
        assertEquals(0, new EmergencyBilling().calculate(a).signum());
        assertEquals(0, new FollowUpBilling().calculate(a).signum());
    }

    @Test
    void selectorFindsEachStrategyByType() {
        var selector =
                new BillingStrategySelector(
                        List.of(
                                new StandardBilling(),
                                new EmergencyBilling(),
                                new FollowUpBilling()),
                        mock(PrescriptionRepository.class));
        for (BillingType t : BillingType.values()) {
            assertEquals(t, selector.strategyFor(t).type());
        }
    }
}
