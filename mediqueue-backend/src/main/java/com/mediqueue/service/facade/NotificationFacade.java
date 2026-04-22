package com.mediqueue.service.facade;

public interface NotificationFacade {
    void sendAppointmentReminder(String toEmail, String patientName, String appointmentTime);
    void sendReportReady(String toEmail, String patientName);
    void sendPrescriptionAvailable(String toEmail, String patientName);
    void sendGeneralAlert(String toEmail, String patientName, String message);
}