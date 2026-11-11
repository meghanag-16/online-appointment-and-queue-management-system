package com.mediqueue.service;

import com.mediqueue.dto.QueueEntryResponse;

import java.time.LocalDate;
import java.util.List;

/** Reading a doctor's virtual queue and moving patients through it. */
public interface QueueService {

    /** The queue of one doctor for one day (today if date is null): active entries in order, then finished ones. */
    List<QueueEntryResponse> getQueue(String doctorId, LocalDate date);

    /** Calls the first waiting patient in today's queue (only when nobody is called or being seen). */
    QueueEntryResponse callNext(String doctorId);

    /** CALLED → IN_CONSULTATION; the appointment becomes IN_PROGRESS. */
    QueueEntryResponse start(Long queueId);

    /** IN_CONSULTATION → FINISHED; the appointment becomes COMPLETED. */
    QueueEntryResponse finish(Long queueId);

    /** A called patient did not come in; the appointment becomes NO_SHOW and leaves the queue. */
    void markNoShow(Long queueId);

    /** Administrator override of a waiting patient's position (null clears it). */
    List<QueueEntryResponse> overridePosition(Long queueId, Integer position);
}
