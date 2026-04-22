package com.mediqueue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patients")
@PrimaryKeyJoinColumn(name = "user_id")
public class Patient extends User {

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "chronic_conditions", columnDefinition = "TEXT")
    private String chronicConditions;

    @Column(name = "emergency_contact", length = 150)
    private String emergencyContact;

    public Patient() {}

    public Patient(String bloodGroup, String allergies, String chronicConditions, String emergencyContact) {
        this.bloodGroup = bloodGroup;
        this.allergies = allergies;
        this.chronicConditions = chronicConditions;
        this.emergencyContact = emergencyContact;
    }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
}
