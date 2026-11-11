package com.mediqueue.event;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Subject in the Observer pattern. AppointmentService calls {@link #publish} after every change;
 * each registered {@link AppointmentObserver} is notified synchronously, inside the same database
 * transaction, so the queue can never disagree with the appointment that changed.
 */
@Component
public class AppointmentEventPublisher {

    private final List<AppointmentObserver> observers = new CopyOnWriteArrayList<>();

    /** Spring passes in every AppointmentObserver bean. */
    public AppointmentEventPublisher(List<AppointmentObserver> observers) {
        this.observers.addAll(observers);
    }

    public void register(AppointmentObserver observer) { observers.add(observer); }

    public void unregister(AppointmentObserver observer) { observers.remove(observer); }

    public void publish(AppointmentEvent event) {
        for (AppointmentObserver observer : observers) {
            observer.onAppointmentEvent(event);
        }
    }
}
