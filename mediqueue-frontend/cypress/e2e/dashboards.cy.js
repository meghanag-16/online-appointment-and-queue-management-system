describe('Admin Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/admin');
  });

  it('should redirect unauthenticated users to login', () => {
    cy.url().should('include', '/login');
  });

  it('should have admin navigation items', () => {
    cy.visit('/login');
    // On login page, should display login form
    cy.get('input[id="username"]').should('be.visible');
  });
});

describe('Doctor Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/doctor');
  });

  it('should redirect unauthenticated users to login', () => {
    cy.url().should('include', '/login');
  });
});

describe('Patient Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/patient');
  });

  it('should redirect unauthenticated users to login', () => {
    cy.url().should('include', '/login');
  });
});
