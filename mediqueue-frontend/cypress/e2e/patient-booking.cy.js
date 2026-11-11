// A patient finds a doctor, books, reschedules and cancels, seeing the result each time.

describe('Patient booking', () => {
  before(() => cy.openSlotsAllDay())

  it('books, reschedules and cancels an appointment', () => {
    cy.createPatient().then(p => {
      cy.loginAs(p.username, p.password)

      // book: search by department text, pick the doctor, the first open time
      cy.visit('/patient/book')
      cy.get('input[aria-label="Doctor name or specialization"]').type('dermatology')
      cy.contains('[data-testid^="doctor-"]', 'Dr. Ananya Bose').click()
      cy.get('[data-testid="slot-picker"] [data-testid^="slot-"]').first().click()
      cy.get('#reason').type('Skin rash')
      cy.get('[data-testid="book-btn"]').click()
      cy.toast('Booked with Dr. Ananya Bose')
      cy.location('pathname').should('eq', '/patient/appointments')
      cy.contains('[data-testid^="my-appointment-"]', 'Skin rash').as('row')
      cy.get('@row').should('contain.text', 'Booked')

      // reschedule to another open time with the same doctor
      cy.get('@row').contains('button', 'Reschedule').click()
      cy.get('[data-testid="reschedule-dialog"] [data-testid="slot-picker"] [data-testid^="slot-"]').first().click()
      cy.get('[data-testid="confirm-reschedule"]').click()
      cy.toast('Moved to')

      // cancel, through the confirm dialog
      cy.contains('[data-testid^="my-appointment-"]', 'Skin rash').contains('button', 'Cancel').click()
      cy.confirmDialog()
      cy.toast('Appointment cancelled')
      cy.contains('[data-testid^="my-appointment-"]', 'Skin rash').should('contain.text', 'Cancelled')

      // the bill for a cancelled visit is void
      cy.visit('/patient/billing')
      cy.get('[data-testid^="bill-"]').first().should('contain.text', 'Void')
    })
  })

  it('shows an empty state before the first booking', () => {
    cy.createPatient().then(p => {
      cy.loginAs(p.username, p.password)
      cy.visit('/patient/appointments')
      cy.get('[data-testid="empty-state"]').should('contain.text', 'No appointments yet')
    })
  })
})
