describe('Authentication Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display the login page', () => {
    cy.get('h1').should('contain', 'MediQueue');
    cy.get('input[id="username"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[id="username"]').type('invaliduser');
    cy.get('input[id="password"]').type('invalidpass');
    cy.get('button[type="submit"]').click();
    cy.get('.alert-error').should('be.visible');
  });

  it('should allow user to navigate to register page', () => {
    cy.get('a').contains('create one').should('be.visible');
    cy.get('a').contains('create one').click();
    cy.url().should('include', '/register');
  });

  it('should display register form on register page', () => {
    cy.visit('/register');
    cy.get('h1').should('contain', 'MediQueue');
    cy.get('input[id="username"]').should('be.visible');
    cy.get('input[id="email"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
  });

  it('should allow user to navigate back to login', () => {
    cy.visit('/register');
    cy.get('a').contains('Sign in').should('be.visible');
    cy.get('a').contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});
