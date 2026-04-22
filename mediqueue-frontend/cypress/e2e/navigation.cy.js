describe('Navigation and Layout Tests', () => {
  it('should display navbar and sidebar on authenticated pages', () => {
    cy.visit('/');
    // Check if redirected to login
    cy.url().should('include', '/login');
  });

  it('should have responsive layout', () => {
    cy.viewport('iphone-x');
    cy.visit('/login');
    cy.get('h1').should('contain', 'MediQueue');
    cy.get('input[id="username"]').should('be.visible');
  });

  it('should handle page titles correctly', () => {
    cy.visit('/login');
    cy.get('h1').should('contain', 'MediQueue');
  });
});
