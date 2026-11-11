// Shared steps for the end-to-end specs. They talk to the real backend (no mocked responses).

const API = '/api/v1'

/** Logs in through the login form and waits for the role's home page. */
Cypress.Commands.add('loginAs', (username, password) => {
  cy.visit('/login')
  cy.get('#username').type(username)
  cy.get('#password').type(password, { log: false })
  cy.get('[data-testid="login-btn"]').click()
  cy.location('pathname').should('not.eq', '/login')
})

Cypress.Commands.add('loginAsAdmin', () => cy.loginAs('admin', Cypress.env('adminPassword')))
Cypress.Commands.add('loginAsStaff', username => cy.loginAs(username, Cypress.env('staffPassword')))

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-btn"]').click()
  cy.location('pathname').should('eq', '/login')
})

/** API login without the UI; yields the token. */
Cypress.Commands.add('apiToken', (username, password) =>
  cy.request('POST', `${API}/auth/login`, { username, password }).its('body.token'),
)

/** Signs up a new patient through the API and yields { username, password, userId, token }. */
Cypress.Commands.add('createPatient', () => {
  const username = `e2e.${Date.now().toString(36)}${Cypress._.random(100, 999)}`
  const password = 'Patient@123'
  return cy
    .request('POST', `${API}/auth/register`, {
      name: `E2E Patient ${username}`,
      username,
      email: `${username}@example.test`,
      password,
      gender: 'FEMALE',
      phoneNumber: '9876543210',
      dateOfBirth: '1995-05-05',
    })
    .then(res => ({ username, password, userId: res.body.userId, token: res.body.token, name: res.body.name }))
})

/**
 * Makes every day bookable around the clock with 15-minute slots and no cancel cutoff, so the
 * journeys can book a slot later today whatever time the tests run. Only for test databases.
 */
Cypress.Commands.add('openSlotsAllDay', () =>
  cy.apiToken('admin', Cypress.env('adminPassword')).then(token =>
    cy.request({
      method: 'PUT',
      url: `${API}/admin/settings/slots`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        slotMinutes: 15,
        dayStart: '00:00',
        dayEnd: '23:45',
        breakStart: null,
        breakEnd: null,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        bookingWindowDays: 7,
        changeCutoffHours: 0,
      },
    }),
  ),
)

/** Clicks Confirm in the app's confirm dialog. */
Cypress.Commands.add('confirmDialog', () => {
  cy.get('[data-testid="confirm-dialog"]').should('be.visible')
  cy.get('[data-testid="confirm-yes"]').click()
})

/** Asserts a toast with this text appears. */
Cypress.Commands.add('toast', text => cy.get('.toast').should('contain.text', text))
