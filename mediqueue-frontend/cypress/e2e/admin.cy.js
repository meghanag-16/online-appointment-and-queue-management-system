// Administrator journeys: staff accounts with temporary passwords, departments, complaints, audit log.

describe('Administrator', () => {
  it('creates a receptionist, who must change the temporary password at first login', () => {
    const username = `desk.${Date.now().toString(36)}`
    cy.loginAsAdmin()
    cy.visit('/admin/users')
    cy.contains('button', 'Create User').click()
    cy.get('#upf-name').type('New Front Desk')
    cy.get('#upf-username').type(username)
    cy.get('#role-select').select('RECEPTIONIST')
    cy.get('#upf-email').type(`${username}@example.test`)
    cy.get('#gender-select').select('Other')
    cy.get('#dob-input').type('1992-02-02')
    cy.get('#phone-input').type('9123456780')
    cy.get('form').contains('button', 'Create User').click()
    cy.get('[data-testid="temp-password"]')
      .invoke('text')
      .then(temporary => {
        cy.logout()
        cy.visit('/login')
        cy.get('#username').type(username)
        cy.get('#password').type(temporary)
        cy.get('[data-testid="login-btn"]').click()
        cy.location('pathname').should('eq', '/change-password')
        cy.get('#cp-current').type(temporary)
        cy.get('#cp-new').type('FrontDesk@2030')
        cy.get('#cp-confirm').type('FrontDesk@2030')
        cy.contains('button', 'Save new password').click()
        cy.location('pathname').should('eq', '/receptionist/dashboard')
      })
  })

  it('adds a department and sees it listed', () => {
    const name = `Neurology ${Date.now().toString(36)}`
    cy.loginAsAdmin()
    cy.visit('/admin/departments')
    cy.get('#dept-name').type(name)
    cy.contains('button', 'Add department').click()
    cy.toast('added')
    cy.contains(name)
  })

  it('moves a complaint from open to resolved, which the patient then sees', () => {
    cy.createPatient().then(p => {
      cy.request({
        method: 'POST',
        url: '/api/v1/complaints',
        headers: { Authorization: `Bearer ${p.token}` },
        body: { issueType: 'Facilities', description: 'The waiting area was too crowded.' },
      }).then(res => {
        const id = res.body.complaintId
        cy.loginAsAdmin()
        cy.visit('/admin/complaints')
        cy.get(`[data-testid="complaint-${id}"]`).contains('button', 'Start review').click()
        cy.toast('under review')
        cy.contains('button', 'Under review').click()
        cy.get(`[data-testid="complaint-${id}"] textarea`).type('Added more seating.')
        cy.get(`[data-testid="complaint-${id}"]`).contains('button', 'Resolve').click()
        cy.toast('resolved')
        cy.logout()

        cy.loginAs(p.username, p.password)
        cy.visit('/patient/complaints')
        cy.get(`[data-testid="my-complaint-${id}"]`).should('contain.text', 'Added more seating.')
      })
    })
  })

  it('shows the audit log with filters', () => {
    cy.loginAsAdmin()
    cy.visit('/admin/audit')
    cy.get('#au-action').select('User Status Changed')
    cy.contains('button', 'Apply').click()
    cy.get('table').should('exist')
  })
})
