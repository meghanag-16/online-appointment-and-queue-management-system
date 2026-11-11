package com.mediqueue.it;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import com.fasterxml.jackson.databind.JsonNode;
import com.mediqueue.entity.TimeSlot;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Role rules (who may call an endpoint) and ownership rules (whose data they may see). */
class SecurityRulesIT extends IntegrationTestBase {

    @Test
    void healthCheckIsPublic() throws Exception {
        JsonNode body = body(send(get("/api/v1/health"), null, null), 200);
        assertEquals("UP", body.get("database").asText());
    }

    @Test
    void missingOrBadTokenGives401() throws Exception {
        assertEquals(401, status(send(get("/api/v1/appointments/all"), null, null)));
        assertEquals(
                401,
                status(
                        send(
                                get("/api/v1/appointments/all")
                                        .header("Authorization", "Bearer not-a-real-token"),
                                null,
                                null)));
    }

    @Test
    void wrongPasswordGives401() throws Exception {
        assertEquals(
                401,
                status(
                        postAs(
                                null,
                                "/api/v1/auth/login",
                                Map.of("username", "admin", "password", "wrong-password"))));
    }

    @Test
    void roleRulesAreEnforced() throws Exception {
        Session patient = newPatient();
        assertEquals(403, status(getAs(patient, "/api/v1/appointments/all")));
        assertEquals(403, status(getAs(patient, "/api/v1/users")));
        assertEquals(200, status(getAs(receptionist(), "/api/v1/doctors/search")));
        assertEquals(200, status(getAs(admin(), "/api/v1/users")));
        assertEquals(403, status(getAs(labTech(), "/api/v1/billing/all")));
    }

    @Test
    void publicSignUpIsForPatientsOnly() throws Exception {
        Map<String, Object> form = new java.util.HashMap<>();
        form.put("name", "Fake Doctor");
        form.put("username", "fake.doc." + System.nanoTime());
        form.put("email", "fake" + System.nanoTime() + "@example.test");
        form.put("password", "Doctor@123");
        form.put("role", "DOCTOR");
        form.put("gender", "MALE");
        form.put("phoneNumber", "9876543210");
        form.put("dateOfBirth", "1990-01-01");
        assertEquals(403, status(postAs(null, "/api/v1/auth/register", form)));
    }

    @Test
    void patientsCannotSeeEachOthersData() throws Exception {
        Session alice = newPatient();
        Session bob = newPatient();
        assertEquals(200, status(getAs(alice, "/api/v1/appointments/patient/" + alice.userId())));
        assertEquals(403, status(getAs(alice, "/api/v1/appointments/patient/" + bob.userId())));
        assertEquals(403, status(getAs(alice, "/api/v1/billing/patient/" + bob.userId())));
        assertEquals(403, status(getAs(alice, "/api/v1/patient/history/" + bob.userId())));
        assertEquals(403, status(getAs(alice, "/api/v1/lab/patient/" + bob.userId())));
    }

    @Test
    void patientBooksOnlyForThemselvesAndAlwaysNormalPriority() throws Exception {
        Session alice = newPatient();
        Session bob = newPatient();
        TimeSlot slot = slotInMinutes("dr.sharma", 600);
        // the body names Bob and asks for high priority; the server ignores both for a patient
        JsonNode appointment = book(alice, bob.userId(), slot, "HIGH_PRIORITY");
        assertEquals(alice.userId(), appointment.get("patientId").asText());
        assertEquals("NORMAL", appointment.get("priority").asText());
    }

    @Test
    void doctorSeesOnlyTheirOwnPatients() throws Exception {
        Session patient = newPatient();
        book(patient, null, slotInMinutes("dr.reddy", 620), null);
        assertEquals(
                200,
                status(getAs(doctor("dr.reddy"), "/api/v1/patient/history/" + patient.userId())));
        assertEquals(
                403,
                status(getAs(doctor("dr.bose"), "/api/v1/patient/history/" + patient.userId())));
    }

    @Test
    void labTechnicianCannotIssuePrescriptions() throws Exception {
        assertEquals(
                403,
                status(
                        postAs(
                                labTech(),
                                "/api/v1/prescriptions",
                                Map.of(
                                        "appointmentId",
                                        1,
                                        "diagnosisNotes",
                                        "x",
                                        "medicationList",
                                        "y"))));
    }

    @Test
    void validationErrorsExplainTheProblem() throws Exception {
        JsonNode body =
                body(
                        postAs(
                                null,
                                "/api/v1/auth/register",
                                Map.of("username", "x", "password", "short")),
                        400);
        assertEquals(true, body.has("fieldErrors"));
    }
}
