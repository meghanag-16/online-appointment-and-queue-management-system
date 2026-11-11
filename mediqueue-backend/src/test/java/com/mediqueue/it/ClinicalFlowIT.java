package com.mediqueue.it;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

/**
 * The cross-role journey: front desk books with priority → the doctor's queue reorders → the doctor
 * sees the patient and prescribes → the lab uploads a report → the patient downloads it. Plus the
 * admin flows around doctors, complaints, payments and the audit log.
 */
class ClinicalFlowIT extends IntegrationTestBase {

    @Test
    void fullVisitFromBookingToLabReport() throws Exception {
        // today's queue: skip in the last minutes before midnight, when "today" would change
        // mid-test
        assumeTrue(LocalTime.now().isBefore(LocalTime.of(23, 40)));
        Session admin = admin();
        DoctorAccount doc = onboardDoctor(admin);
        Session desk = receptionist();
        Session normal = newPatient();
        Session urgent = newPatient();

        // normal patient has the earlier slot, urgent patient the later one but high priority
        long normalId =
                book(desk, normal.userId(), slotInMinutes(doc.username, 5), "NORMAL")
                        .get("appointmentId")
                        .asLong();
        long urgentId =
                book(desk, urgent.userId(), slotInMinutes(doc.username, 10), "NORMAL")
                        .get("appointmentId")
                        .asLong();
        body(
                patchAs(
                        desk,
                        "/api/v1/appointments/" + urgentId + "/priority",
                        Map.of("priority", "HIGH_PRIORITY")),
                200);

        Session doctor = doc.session;
        JsonNode queue = body(getAs(doctor, "/api/v1/queue/doctor/" + doc.userId), 200);
        assertEquals(urgentId, queue.get(0).get("appointmentId").asLong());
        assertEquals(normalId, queue.get(1).get("appointmentId").asLong());

        JsonNode called =
                body(
                        postAs(doctor, "/api/v1/queue/doctor/" + doc.userId + "/call-next", null),
                        200);
        assertEquals(urgentId, called.get("appointmentId").asLong());
        long queueId = called.get("queueId").asLong();
        body(postAs(doctor, "/api/v1/queue/entries/" + queueId + "/start", null), 200);

        // a second patient can't be called while one is in consultation
        assertEquals(
                400,
                status(postAs(doctor, "/api/v1/queue/doctor/" + doc.userId + "/call-next", null)));

        body(
                postAs(
                        doctor,
                        "/api/v1/prescriptions",
                        Map.of(
                                "appointmentId",
                                urgentId,
                                "diagnosisNotes",
                                "Viral fever",
                                "medicationList",
                                "Paracetamol 500mg")),
                201);
        JsonNode visit = body(getAs(urgent, "/api/v1/appointments/" + urgentId), 200);
        assertEquals("COMPLETED", visit.get("status").asText());
        JsonNode record = body(getAs(urgent, "/api/v1/patient/records/" + urgent.userId()), 200);
        assertTrue(record.get("diagnoses").asText().contains("Viral fever"));
        assertEquals(
                1,
                body(getAs(urgent, "/api/v1/prescriptions/patient/" + urgent.userId()), 200)
                        .size());
        assertTrue(hasNotification(urgent, "PRESCRIPTION_AVAILABLE"));

        // the lab uploads a report; the patient is notified and downloads the same bytes
        Session lab = labTech();
        JsonNode report = body(upload(lab, urgentId, "blood.pdf", PDF), 201);
        assertTrue(hasNotification(urgent, "REPORT_READY"));
        MvcResult download =
                getAs(
                        urgent,
                        "/api/v1/lab/reports/" + report.get("reportId").asLong() + "/download");
        assertEquals(200, status(download));
        assertArrayEquals(PDF, download.getResponse().getContentAsByteArray());
        assertEquals(
                403,
                status(
                        getAs(
                                normal,
                                "/api/v1/lab/reports/"
                                        + report.get("reportId").asLong()
                                        + "/download")));
        // a renamed non-PDF is rejected
        assertEquals(400, status(upload(lab, urgentId, "fake.pdf", "MZ-not-a-pdf".getBytes())));

        // the doctor dashboard reflects the day
        JsonNode dashboard = body(getAs(doctor, "/api/v1/doctor/dashboard/" + doc.userId), 200);
        assertEquals(1, dashboard.get("completedToday").asLong());
    }

    @Test
    void newStaffMustChangeTheTemporaryPassword() throws Exception {
        Session admin = admin();
        Map<String, Object> form = staffForm("RECEPTIONIST");
        JsonNode created = body(postAs(admin, "/api/v1/users", form), 201);
        String username = (String) form.get("username");
        Session newUser = login(username, created.get("temporaryPassword").asText());

        JsonNode blocked = body(getAs(newUser, "/api/v1/appointments/all"), 403);
        assertEquals("PASSWORD_CHANGE_REQUIRED", blocked.get("code").asText());
        body(
                putAs(
                        newUser,
                        "/api/v1/auth/me/password",
                        Map.of(
                                "currentPassword",
                                created.get("temporaryPassword").asText(),
                                "newPassword",
                                "NewPassword@1")),
                200);
        assertEquals(200, status(getAs(newUser, "/api/v1/appointments/all")));
    }

    @Test
    void deactivatingADoctorCancelsTheirUpcomingAppointments() throws Exception {
        Session admin = admin();
        DoctorAccount doc = onboardDoctor(admin);
        Session patient = newPatient();
        long id =
                book(patient, null, slotInMinutes(doc.username, 900), null)
                        .get("appointmentId")
                        .asLong();

        body(putAs(admin, "/api/v1/admin/doctors/" + doc.userId + "/deactivate", null), 200);
        assertEquals(
                "CANCELLED",
                body(getAs(patient, "/api/v1/appointments/" + id), 200).get("status").asText());
        assertEquals(401, status(getAs(doc.session, "/api/v1/auth/me")));
        assertTrue(hasNotification(patient, "GENERAL_ALERT"));

        body(
                patchAs(
                        admin,
                        "/api/v1/users/" + doc.userId + "/status",
                        Map.of("status", "ACTIVE")),
                200);
        assertTrue(
                body(getAs(patient, "/api/v1/doctors/" + doc.userId + "/slots"), 200).size() > 0);
    }

    @Test
    void complaintGoesOpenUnderReviewResolved() throws Exception {
        Session patient = newPatient();
        Session admin = admin();
        JsonNode complaint =
                body(
                        postAs(
                                patient,
                                "/api/v1/complaints",
                                Map.of(
                                        "issueType",
                                        "Waiting time",
                                        "description",
                                        "Waited too long")),
                        201);
        String id = complaint.get("complaintId").asText();
        // cannot skip the review step, and resolving needs a note
        assertEquals(
                400,
                status(
                        patchAs(
                                admin,
                                "/api/v1/complaints/" + id + "/status",
                                Map.of("status", "RESOLVED", "note", "done"))));
        body(
                patchAs(
                        admin,
                        "/api/v1/complaints/" + id + "/status",
                        Map.of("status", "UNDER_REVIEW")),
                200);
        assertEquals(
                400,
                status(
                        patchAs(
                                admin,
                                "/api/v1/complaints/" + id + "/status",
                                Map.of("status", "RESOLVED"))));
        body(
                patchAs(
                        admin,
                        "/api/v1/complaints/" + id + "/status",
                        Map.of("status", "RESOLVED", "note", "Added a second doctor on Mondays")),
                200);
        JsonNode mine = body(getAs(patient, "/api/v1/complaints/mine"), 200);
        assertEquals("RESOLVED", mine.get(0).get("status").asText());
        assertEquals("Added a second doctor on Mondays", mine.get(0).get("resolution").asText());
    }

    @Test
    void frontDeskCollectsPaymentAndCancellationRefundsIt() throws Exception {
        Session patient = newPatient();
        Session desk = receptionist();
        long id =
                book(patient, null, slotInMinutes("dr.sharma", 960), null)
                        .get("appointmentId")
                        .asLong();
        JsonNode bill = body(getAs(patient, "/api/v1/billing/appointment/" + id), 200);
        long billId = bill.get("billId").asLong();

        assertEquals(
                400,
                status(
                        patchAs(
                                desk,
                                "/api/v1/billing/" + billId + "/payment",
                                Map.of("paymentStatus", "PAID"))));
        body(
                patchAs(
                        desk,
                        "/api/v1/billing/" + billId + "/payment",
                        Map.of("paymentStatus", "PAID", "paymentMethod", "UPI")),
                200);
        body(patchAs(desk, "/api/v1/appointments/" + id + "/cancel", null), 200);
        assertEquals(
                "REFUNDED",
                body(getAs(patient, "/api/v1/billing/appointment/" + id), 200)
                        .get("paymentStatus")
                        .asText());
        assertTrue(body(getAs(desk, "/api/v1/billing/all?status=REFUNDED"), 200).size() >= 1);
    }

    @Test
    void adminScreensLoad() throws Exception {
        Session admin = admin();
        assertTrue(body(getAs(admin, "/api/v1/admin/dashboard"), 200).has("totalUsers"));
        assertTrue(
                body(getAs(admin, "/api/v1/admin/audit?action=APPOINTMENT_BOOKED"), 200).isArray());
        assertTrue(body(getAs(admin, "/api/v1/settings/slots"), 200).has("slotMinutes"));
        JsonNode sent =
                body(
                        postAs(
                                admin,
                                "/api/v1/notifications/alert",
                                Map.of("role", "LAB_TECHNICIAN", "message", "Lab closed Sunday")),
                        200);
        assertTrue(sent.get("sent").asInt() >= 1);
        Session lab = labTech();
        JsonNode inbox = body(getAs(lab, "/api/v1/notifications/mine"), 200);
        assertTrue(inbox.get("unreadCount").asLong() >= 1);
        body(patchAs(lab, "/api/v1/notifications/mine/read-all", null), 200);
        assertEquals(
                0, body(getAs(lab, "/api/v1/notifications/mine"), 200).get("unreadCount").asLong());
        assertTrue(
                body(getAs(receptionist(), "/api/v1/appointments/stats"), 200).has("todayTotal"));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    record DoctorAccount(String username, String userId, Session session) {}

    /** A fresh doctor (so no other test touches their queue), logged in with a changed password. */
    private DoctorAccount onboardDoctor(Session admin) throws Exception {
        Map<String, Object> form = staffForm("DOCTOR");
        form.put("departmentId", "DEPT-GENM");
        form.put("specialization", "General Physician");
        form.put("consultationFee", 500);
        JsonNode created = body(postAs(admin, "/api/v1/admin/doctors", form), 201);
        String username = (String) form.get("username");
        String userId = created.get("user").get("userId").asText();
        Session first = login(username, created.get("temporaryPassword").asText());
        body(
                putAs(
                        first,
                        "/api/v1/auth/me/password",
                        Map.of(
                                "currentPassword",
                                created.get("temporaryPassword").asText(),
                                "newPassword",
                                STAFF_PASSWORD)),
                200);
        return new DoctorAccount(username, userId, login(username, STAFF_PASSWORD));
    }

    private static Map<String, Object> staffForm(String role) {
        String username = "it.staff." + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> form = new HashMap<>();
        form.put("name", "Staff " + username);
        form.put("username", username);
        form.put("email", username + "@example.test");
        form.put("role", role);
        form.put("gender", "OTHER");
        form.put("phoneNumber", "9123456780");
        form.put("dateOfBirth", "1988-08-08");
        return form;
    }

    private boolean hasNotification(Session user, String type) throws Exception {
        JsonNode inbox = body(getAs(user, "/api/v1/notifications/mine?limit=50"), 200);
        for (JsonNode n : inbox.get("items")) {
            if (type.equals(n.get("type").asText())) return true;
        }
        return false;
    }
}
