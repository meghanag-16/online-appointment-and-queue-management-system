// Custom commands for Cypress tests

// Command to login
Cypress.Commands.add('login', (username = 'testuser', password = 'testpass') => {
  cy.visit('/login');
  cy.get('input[id="username"]').type(username);
  cy.get('input[id="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout-btn"]').click();
  cy.url().should('include', '/login');
});

// Command to intercept API calls
Cypress.Commands.add('interceptApi', (method, endpoint, fixture) => {
  cy.intercept(method, `*${endpoint}*`, { fixture }).as(endpoint);
});

// Command to wait for API response
Cypress.Commands.add('waitForApi', (endpoint) => {
  cy.wait(`@${endpoint}`);
});
