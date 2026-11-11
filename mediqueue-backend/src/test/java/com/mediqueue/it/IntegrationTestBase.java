package com.mediqueue.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediqueue.entity.Doctor;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.SlotStatus;
import com.mediqueue.repository.DoctorRepository;
import com.mediqueue.repository.TimeSlotRepository;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Integration tests run the whole application (Flyway migrations, seed data, security, services and
 * repositories) against a real MySQL database. They need IT_DATASOURCE_URL (and optionally
 * IT_DATASOURCE_USERNAME / IT_DATASOURCE_PASSWORD) pointing at an empty database, for example
 * {@code jdbc:mysql://localhost:3306/mediqueue_it?createDatabaseIfNotExist=true}; without it they
 * are skipped. CI provides a MySQL service for them.
 *
 * <p>All test classes share one application and database, so each test creates its own patients
 * with unique names and never depends on another test's data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "IT_DATASOURCE_URL", matches = ".+")
abstract class IntegrationTestBase {

    static final String ADMIN_PASSWORD = "Admin@123";
    static final String STAFF_PASSWORD = "Welcome@123";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TimeSlotRepository timeSlots;
    @Autowired DoctorRepository doctors;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("IT_DATASOURCE_URL"));
        registry.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("IT_DATASOURCE_USERNAME", "root"));
        registry.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("IT_DATASOURCE_PASSWORD", "root"));
        registry.add("app.jwt.secret", () -> "integration-test-secret-key-at-least-32-chars");
        registry.add("app.seed.enabled", () -> "true");
        registry.add("app.seed.admin-password", () -> ADMIN_PASSWORD);
        registry.add("app.seed.default-password", () -> STAFF_PASSWORD);
        // keep the reminder job out of the way of the tests
        registry.add("app.reminders.initial-delay-ms", () -> "3600000");
    }

    // ── logins ───────────────────────────────────────────────────────────────

    record Session(String token, String userId) {}

    Session login(String username, String password) throws Exception {
        JsonNode body =
                body(
                        mvc.perform(
                                        post("/api/v1/auth/login")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        json.writeValueAsString(
                                                                Map.of(
                                                                        "username",
                                                                        username,
                                                                        "password",
                                                                        password))))
                                .andReturn(),
                        200);
        return new Session(body.get("token").asText(), body.get("userId").asText());
    }

    Session admin() throws Exception {
        return login("admin", ADMIN_PASSWORD);
    }

    Session receptionist() throws Exception {
        return login("reception", STAFF_PASSWORD);
    }

    Session labTech() throws Exception {
        return login("labtech", STAFF_PASSWORD);
    }

    Session doctor(String username) throws Exception {
        return login(username, STAFF_PASSWORD);
    }

    /** Signs up a brand-new patient (unique username) and returns their session. */
    Session newPatient() throws Exception {
        String username = "it." + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> form =
                Map.of(
                        "name", "Test Patient " + username,
                        "username", username,
                        "email", username + "@example.test",
                        "password", "Patient@123",
                        "gender", "FEMALE",
                        "phoneNumber", "9876543210",
                        "dateOfBirth", "1995-05-05");
        JsonNode body = body(send(post("/api/v1/auth/register"), null, form), 201);
        return new Session(body.get("token").asText(), body.get("userId").asText());
    }

    String doctorId(String username) {
        return doctors.findAll().stream()
                .filter(d -> username.equals(d.getUsername()))
                .findFirst()
                .orElseThrow()
                .getUserId();
    }

    /** An open slot for the doctor that starts the given number of minutes from now. */
    TimeSlot slotInMinutes(String doctorUsername, long minutes) {
        Doctor doctor = doctors.findById(doctorId(doctorUsername)).orElseThrow();
        LocalDateTime start = LocalDateTime.now().plusMinutes(minutes).withSecond(0).withNano(0);
        return timeSlots.save(
                new TimeSlot(null, doctor, start, start.plusMinutes(1), SlotStatus.AVAILABLE));
    }

    // ── requests ─────────────────────────────────────────────────────────────

    MvcResult send(MockHttpServletRequestBuilder request, Session as, Object payload)
            throws Exception {
        if (as != null) request.header("Authorization", "Bearer " + as.token());
        if (payload != null) {
            request.contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(payload));
        }
        return mvc.perform(request).andReturn();
    }

    MvcResult getAs(Session as, String path) throws Exception {
        return send(get(path), as, null);
    }

    MvcResult postAs(Session as, String path, Object payload) throws Exception {
        return send(post(path), as, payload);
    }

    MvcResult putAs(Session as, String path, Object payload) throws Exception {
        return send(put(path), as, payload);
    }

    MvcResult patchAs(Session as, String path, Object payload) throws Exception {
        return send(patch(path), as, payload);
    }

    MvcResult upload(Session as, long appointmentId, String fileName, byte[] content)
            throws Exception {
        return mvc.perform(
                        multipart("/api/v1/lab/upload")
                                .file(
                                        new MockMultipartFile(
                                                "file",
                                                fileName,
                                                "application/octet-stream",
                                                content))
                                .param("appointmentId", String.valueOf(appointmentId))
                                .param("reportType", "Blood test")
                                .header("Authorization", "Bearer " + as.token()))
                .andReturn();
    }

    /** Asserts the status and returns the JSON body. */
    JsonNode body(MvcResult result, int expectedStatus) throws Exception {
        String text = result.getResponse().getContentAsString();
        if (result.getResponse().getStatus() != expectedStatus) {
            throw new AssertionError(
                    "Expected HTTP "
                            + expectedStatus
                            + " but got "
                            + result.getResponse().getStatus()
                            + ": "
                            + text);
        }
        return text.isEmpty() ? json.nullNode() : json.readTree(text);
    }

    int status(MvcResult result) {
        return result.getResponse().getStatus();
    }

    /** Books the slot as the given user and returns the appointment. */
    JsonNode book(Session as, String patientId, TimeSlot slot, String priority) throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("slotId", slot.getSlotId());
        payload.put("reasonForVisit", "Integration test");
        if (patientId != null) payload.put("patientId", patientId);
        if (priority != null) payload.put("priority", priority);
        return body(postAs(as, "/api/v1/appointments", payload), 201);
    }

    static final byte[] PDF =
            "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
                    .getBytes(java.nio.charset.StandardCharsets.US_ASCII);
}
