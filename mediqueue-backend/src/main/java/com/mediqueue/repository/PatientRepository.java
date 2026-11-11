package com.mediqueue.repository;

import com.mediqueue.entity.Patient;
import com.mediqueue.entity.enums.AccountStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, String> {

    /** Active patients whose name, username, phone, email or ID contains the text (lower-case LIKE term). */
    @Query("""
        select p from Patient p
        where p.accountStatus = :status
          and (lower(p.name) like :term or lower(p.username) like :term or lower(p.email) like :term
               or p.phoneNumber like :term or lower(p.userId) like :term)
        order by p.name
        """)
    List<Patient> search(@Param("term") String likeTerm, @Param("status") AccountStatus status, Pageable page);

    /** Patients that have no medical record yet. */
    @Query("select p from Patient p where not exists (select r.recordId from MedicalRecord r where r.patient = p)")
    List<Patient> findPatientsWithoutMedicalRecord();
}
