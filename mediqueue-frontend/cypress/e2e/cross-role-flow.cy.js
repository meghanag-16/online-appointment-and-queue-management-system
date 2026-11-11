// The whole visit across roles:
// patient books → front desk marks high priority → doctor's queue → consultation and prescription
// → lab uploads a report → patient sees the prescription and downloads the report.

describe('Cross-role visit', () => {
  const doctor = { username: 'dr.sharma', name: 'Dr. Neha Sharma' }
  let patient
  let appointmentId

  before(() => {
    cy.openSlotsAllDay()
    cy.createPatient().then(p => {
      patient = p
    })
  })

  it('1. the patient books with the doctor for later today', () => {
    cy.loginAs(patient.username, patient.password)
    cy.visit('/patient/book')
    cy.get('input[aria-label="Doctor name or specialization"]').type('sharma')
    cy.contains('[data-testid^="doctor-"]', doctor.name).click()
    // the first day chip is today; take its first open time
    cy.get('[data-testid="slot-picker"] .chip').first().should('contain.text', 'Today')
    cy.get('[data-testid="slot-picker"] [data-testid^="slot-"]').first().click()
    cy.get('#reason').type('Fever and headache')
    cy.get('[data-testid="book-btn"]').click()
    cy.toast(`Booked with ${doctor.name}`)
    cy.request({
      url: `/api/v1/appointments/patient/${patient.userId}`,
      headers: { Authorization: `Bearer ${patient.token}` },
    }).then(res => {
      appointmentId = res.body[0].appointmentId
    })
  })

  it('2. the front desk marks the patient high priority on the queue board', () => {
    cy.loginAsStaff('reception')
    cy.visit('/receptionist/queue')
    cy.get('#qb-doctor')
      .find('option')
      .contains(doctor.name)
      .then(option => {
        cy.get('#qb-doctor').select(option.val())
      })
    cy.get(`[data-testid="priority-${appointmentId}"]`).should('contain.text', 'Mark high priority').click()
    cy.toast('is now high priority')
    cy.get(`[data-testid="queue-row-${appointmentId}"]`).should('contain.text', 'High Priority')
  })

  it('3. the doctor calls the patient, consults and prescribes', () => {
    cy.loginAsStaff(doctor.username)
    cy.visit('/doctor/queue')
    cy.get(`[data-testid="queue-row-${appointmentId}"]`).should('contain.text', 'High Priority')
    cy.get('[data-testid="call-next-btn"]').click()
    cy.toast('has been called in')
    cy.get(`[data-testid="queue-row-${appointmentId}"]`).within(() => {
      cy.get('[data-testid="start-btn"]').click()
    })
    cy.toast('Consultation with')
    cy.get(`[data-testid="queue-row-${appointmentId}"] [data-testid="write-prescription-btn"]`).click()

    cy.location('search').should('contain', `appointmentId=${appointmentId}`)
    cy.get('#rx-diag').type('Viral fever')
    cy.get('#rx-meds').type('Paracetamol 500mg twice daily for 3 days')
    cy.contains('button', 'Issue prescription').click()
    cy.toast('Prescription issued')
  })

  it('4. the lab finds the appointment and uploads a report', () => {
    cy.loginAsStaff('labtech')
    cy.get('[data-testid="lab-search"]').type(String(appointmentId))
    cy.contains('button', 'Search').click()
    cy.get(`[data-testid="lab-appt-${appointmentId}"]`).should('have.class', 'row-highlight')
    cy.get('#lab-test').type('Blood test')
    cy.get('[data-testid="lab-file"]').selectFile('cypress/fixtures/report.pdf')
    cy.get('[data-testid="upload-btn"]').click()
    cy.toast('Blood test uploaded')
  })

  it('5. the patient sees the prescription, is notified and downloads the report', () => {
    cy.loginAs(patient.username, patient.password)
    cy.get('[data-testid="notification-count"]').should('exist')

    cy.visit('/patient/prescriptions')
    cy.get('[data-testid="prescription-card"]').should('contain.text', 'Viral fever')

    cy.visit('/patient/records')
    cy.contains('Viral fever')

    cy.visit('/patient/reports')
    cy.get('[data-testid^="report-row-"]').should('contain.text', 'Blood test')
    cy.get('[data-testid^="download-"]').first().click()
    cy.readFile('cypress/downloads/report.pdf').should('contain', '%PDF')

    // the visit itself is completed and its bill was priced at the emergency rate
    cy.visit('/patient/appointments')
    cy.get(`[data-testid="my-appointment-${appointmentId}"]`).should('contain.text', 'Completed')
    cy.visit('/patient/billing')
    cy.get('[data-testid^="bill-"]').first().should('contain.text', 'Emergency')
  })
})
