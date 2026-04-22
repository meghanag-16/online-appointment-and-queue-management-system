package com.mediqueue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lab_technicians")
@PrimaryKeyJoinColumn(name = "user_id")
public class LabTechnician extends User {
    
    public LabTechnician() {}
}
