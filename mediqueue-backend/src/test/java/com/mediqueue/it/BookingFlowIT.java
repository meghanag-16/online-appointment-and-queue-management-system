package com.mediqueue.it;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.mediqueue.entity.TimeSlot;
import com.mediqueue.entity.enums.SlotStatus;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;

/** Booking, cancelling, rescheduling, alternates and double-booking against the real database. */
class BookingFlowIT extends IntegrationTestBase {

    @Test
    void bookCancelAndTheSlotComesBack() throws Exception {
        Session patient = newPatient();
        TimeSlot slot = slotInMinutes("dr.nair", 700);

        JsonNode appointment = book(patient, null, slot, null);
        assertEquals("BOOKED", appointment.get("status").asText());
        assertEquals(
                SlotStatus.BOOKED, timeSlots.findById(slot.getSlotId()).orElseThrow().getStatus());

        long id = appointment.get("appointmentId").asLong();
        JsonNode cancelled =
                body(patchAs(patient, "/api/v1/appointments/" + id + "/cancel", null), 200);
        assertEquals("CANCELLED", cancelled.get("status").asText());
        assertEquals(
                SlotStatus.AVAILABLE,
                timeSlots.findById(slot.getSlotId()).orElseThrow().getStatus());

        JsonNode bill = body(getAs(patient, "/api/v1/billing/appointment/" + id), 200);
        assertEquals("VOID", bill.get("paymentStatus").asText());
    }

    @Test
    void rescheduleMovesToTheNewSlot() throws Exception {
        Session patient = newPatient();
        TimeSlot first = slotInMinutes("dr.das", 720);
        TimeSlot second = slotInMinutes("dr.das", 740);
        long id = book(patient, null, first, null).get("appointmentId").asLong();

        JsonNode moved =
                body(
                        patchAs(
                                patient,
                                "/api/v1/appointments/" + id + "/reschedule",
                                Map.of("slotId", second.getSlotId())),
                        200);
        assertEquals(second.getSlotId().longValue(), moved.get("slotId").asLong());
        assertEquals(
                SlotStatus.AVAILABLE,
                timeSlots.findById(first.getSlotId()).orElseThrow().getStatus());
        assertEquals(
                SlotStatus.BOOKED,
                timeSlots.findById(second.getSlotId()).orElseThrow().getStatus());
    }

    @Test
    void patientCannotCancelInsideTheCutoff() throws Exception {
        Session patient = newPatient();
        // default cutoff is 2 hours; this slot starts in 30 minutes
        long id =
                book(patient, null, slotInMinutes("dr.khan", 30), null)
                        .get("appointmentId")
                        .asLong();
        JsonNode error =
                body(patchAs(patient, "/api/v1/appointments/" + id + "/cancel", null), 400);
        assertTrue(error.get("error").asText().contains("before the start time"));
        // the front desk can still cancel it
        assertEquals(
                200,
                status(patchAs(receptionist(), "/api/v1/appointments/" + id + "/cancel", null)));
    }

    @Test
    void takenSlotReturnsAlternates() throws Exception {
        TimeSlot slot = slotInMinutes("dr.mehta", 760);
        slotInMinutes("dr.mehta", 780); // an open alternative with the same doctor
        book(newPatient(), null, slot, null);

        JsonNode error =
                body(
                        postAs(
                                newPatient(),
                                "/api/v1/appointments",
                                Map.of("slotId", slot.getSlotId())),
                        409);
        assertTrue(error.get("alternateSlots").isArray());
        assertFalse(error.get("alternateSlots").isEmpty());
    }

    @Test
    void slotMustBelongToTheChosenDoctor() throws Exception {
        TimeSlot slot = slotInMinutes("dr.iyer", 800);
        body(
                postAs(
                        newPatient(),
                        "/api/v1/appointments",
                        Map.of("slotId", slot.getSlotId(), "doctorId", doctorId("dr.mehta"))),
                400);
    }

    @Test
    void onlyAllowedStatusChanges() throws Exception {
        Session patient = newPatient();
        long id =
                book(patient, null, slotInMinutes("dr.rao", 820), null)
                        .get("appointmentId")
                        .asLong();
        Session desk = receptionist();
        assertEquals(
                200,
                status(
                        patchAs(
                                desk,
                                "/api/v1/appointments/" + id + "/status",
                                Map.of("status", "CONFIRMED"))));
        // a future visit cannot be completed yet, and COMPLETED -> BOOKED is never allowed
        assertEquals(
                400,
                status(
                        patchAs(
                                desk,
                                "/api/v1/appointments/" + id + "/status",
                                Map.of("status", "COMPLETED"))));
        assertEquals(
                400,
                status(
                        patchAs(
                                desk,
                                "/api/v1/appointments/" + id + "/status",
                                Map.of("status", "NOT_A_STATUS"))));
    }

    @Test
    void twoPeopleBookingTheSameSlotAtOnceOnlyOneWins() throws Exception {
        TimeSlot slot = slotInMinutes("dr.pillai", 840);
        int attempts = 6;
        List<Session> patients = new ArrayList<>();
        for (int i = 0; i < attempts; i++) patients.add(newPatient());

        ExecutorService pool = Executors.newFixedThreadPool(attempts);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (Session p : patients) {
            Callable<Integer> attempt =
                    () -> {
                        start.await();
                        return status(
                                postAs(
                                        p,
                                        "/api/v1/appointments",
                                        Map.of("slotId", slot.getSlotId())));
                    };
            results.add(pool.submit(attempt));
        }
        start.countDown();
        int created = 0;
        int conflicts = 0;
        for (Future<Integer> r : results) {
            int code = r.get();
            if (code == 201) created++;
            if (code == 409) conflicts++;
        }
        pool.shutdown();
        assertEquals(1, created);
        assertEquals(attempts - 1, conflicts);
    }

    @Test
    void receptionistBooksForAPatientWithHighPriority() throws Exception {
        Session patient = newPatient();
        JsonNode appointment =
                book(
                        receptionist(),
                        patient.userId(),
                        slotInMinutes("dr.bose", 860),
                        "HIGH_PRIORITY");
        assertEquals(patient.userId(), appointment.get("patientId").asText());
        assertEquals("HIGH_PRIORITY", appointment.get("priority").asText());
        JsonNode bill =
                body(
                        getAs(
                                patient,
                                "/api/v1/billing/appointment/"
                                        + appointment.get("appointmentId").asLong()),
                        200);
        assertEquals("EMERGENCY", bill.get("billingStrategy").asText());
    }

    @Test
    void doctorSearchFindsActiveDoctorsByDepartmentText() throws Exception {
        JsonNode doctors = body(getAs(newPatient(), "/api/v1/doctors/search?q=cardiology"), 200);
        assertTrue(doctors.size() >= 2);
        doctors.forEach(d -> assertEquals("Cardiology", d.get("departmentName").asText()));
    }
}
