package com.mediqueue.service.facade;

import org.springframework.stereotype.Service;

@Service
public class NotificationFacadeImpl implements NotificationFacade {

    @Override
    public void sendAppointmentReminder(String toEmail, String patientName, String appointmentTime) {
        System.out.println("[EMAIL] To: " + toEmail);
        System.out.println("[MSG] Dear " + patientName + ", your appointment is at " + appointmentTime);
    }

    @Override
    public void sendReportReady(String toEmail, String patientName) {
        System.out.println("[EMAIL] To: " + toEmail);
        System.out.println("[MSG] Dear " + patientName + ", your lab report is ready. Please log in to view it.");
    }

    @Override
    public void sendPrescriptionAvailable(String toEmail, String patientName) {
        System.out.println("[EMAIL] To: " + toEmail);
        System.out.println("[MSG] Dear " + patientName + ", your prescription has been issued by your doctor.");
    }

    @Override
    public void sendGeneralAlert(String toEmail, String patientName, String message) {
        System.out.println("[EMAIL] To: " + toEmail);
        System.out.println("[MSG] Dear " + patientName + ", " + message);
    }
}