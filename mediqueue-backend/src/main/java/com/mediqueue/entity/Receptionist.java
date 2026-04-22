package com.mediqueue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "receptionists")
@PrimaryKeyJoinColumn(name = "user_id")
public class Receptionist extends User {
    
    public Receptionist() {}
}
