package com.mediqueue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "administrators")
@PrimaryKeyJoinColumn(name = "user_id")
public class Administrator extends User {
    
    public Administrator() {}
}
