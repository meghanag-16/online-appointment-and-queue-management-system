package com.mediqueue.repository;
import com.mediqueue.entity.Receptionist;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ReceptionistRepository extends JpaRepository<Receptionist, String> {}
