// Signing in and out for every role, wrong passwords, patient sign-up and route protection.

describe('Landing page and sign-in', () => {
  it('shows the landing page to visitors and links to sign in and sign up', () => {
    cy.visit('/')
    cy.contains('h1', 'Less waiting room.')
    cy.get('[data-testid="landing-login"]').click()
    cy.location('pathname').should('eq', '/login')
    cy.contains('a', 'Register').click()
    cy.location('pathname').should('eq', '/register')
  })

  it('rejects a wrong password with a clear message', () => {
    cy.visit('/login')
    cy.get('#username').type('admin')
    cy.get('#password').type('definitely-wrong')
    cy.get('[data-testid="login-btn"]').click()
    cy.get('.alert-error').should('contain.text', 'Invalid username or password')
    cy.location('pathname').should('eq', '/login')
  })

  const homes = [
    ['admin', 'admin', '/admin/dashboard', 'Admin Dashboard'],
    ['receptionist', 'reception', '/receptionist/dashboard', 'Receptionist Dashboard'],
    ['lab technician', 'labtech', '/lab/dashboard', 'Upload Lab Reports'],
    ['doctor', 'dr.mehta', '/doctor/dashboard', 'Dr. Arjun Mehta'],
    ['patient', 'patient', '/patient/dashboard', 'Welcome, Riya Nair'],
  ]
  homes.forEach(([role, username, home, heading]) => {
    it(`signs the ${role} in to their home page and out again`, () => {
      const password = username === 'admin' ? Cypress.env('adminPassword') : Cypress.env('staffPassword')
      cy.loginAs(username, password)
      cy.location('pathname').should('eq', home)
      cy.contains('h1', heading)
      cy.logout()
    })
  })

  it('keeps people out of pages for other roles', () => {
    cy.loginAs('patient', Cypress.env('staffPassword'))
    cy.visit('/admin/users')
    cy.location('pathname').should('eq', '/unauthorized')
    cy.contains('h1', 'Access Denied')
  })

  it('sends signed-out visitors from a private page to the login page', () => {
    cy.visit('/patient/appointments')
    cy.location('pathname').should('eq', '/login')
  })
})

describe('Patient sign-up', () => {
  it('registers a new patient and lands on their dashboard', () => {
    const username = `signup.${Date.now().toString(36)}`
    cy.visit('/register')
    cy.get('#upf-name').type('Sign Up Tester')
    cy.get('#upf-username').type(username)
    cy.get('#upf-email').type(`${username}@example.test`)
    cy.get('#upf-password').type('Patient@123')
    cy.get('#gender-select').select('Female')
    cy.get('#dob-input').type('1996-04-12')
    cy.get('#phone-input').type('9876501234')
    cy.contains('button', 'Register').click()
    cy.location('pathname').should('eq', '/patient/dashboard')
    cy.contains('h1', 'Welcome, Sign Up Tester')
  })

  it('shows the server validation message when the username is taken', () => {
    cy.visit('/register')
    cy.get('#upf-name').type('Duplicate')
    cy.get('#upf-username').type('admin')
    cy.get('#upf-email').type(`dup.${Date.now()}@example.test`)
    cy.get('#upf-password').type('Patient@123')
    cy.get('#gender-select').select('Male')
    cy.get('#dob-input').type('1990-01-01')
    cy.get('#phone-input').type('9876501234')
    cy.contains('button', 'Register').click()
    cy.get('.alert-error').should('contain.text', 'Username already taken')
  })
})
