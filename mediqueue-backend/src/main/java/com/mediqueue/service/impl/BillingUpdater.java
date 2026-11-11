package com.mediqueue.service.impl;

import com.mediqueue.entity.enums.AppointmentStatus;
import com.mediqueue.event.AppointmentEvent;
import com.mediqueue.event.AppointmentObserver;
import com.mediqueue.repository.AppointmentRepository;
import com.mediqueue.service.BillingService;
import org.springframework.stereotype.Component;

/**
 * Observer: keeps each appointment's bill in step with it. A booking creates the bill, a priority
 * or time change re-prices it while unpaid, and a cancellation voids or refunds it.
 */
@Component
public class BillingUpdater implements AppointmentObserver {

    private final BillingService billingService;
    private final AppointmentRepository appointmentRepository;

    public BillingUpdater(BillingService billingService, AppointmentRepository appointmentRepository) {
        this.billingService = billingService;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public void onAppointmentEvent(AppointmentEvent event) {
        switch (event.type()) {
            case BOOKED, PRIORITY_CHANGED, RESCHEDULED -> billingService.priceAppointment(event.appointmentId());
            case CANCELLED -> billingService.settleCancelledAppointment(event.appointmentId());
            case STATUS_CHANGED -> appointmentRepository.findById(event.appointmentId())
                .filter(a -> a.getAppointmentStatus() == AppointmentStatus.CANCELLED)
                .ifPresent(a -> billingService.settleCancelledAppointment(a.getAppointmentId()));
        }
    }
}
