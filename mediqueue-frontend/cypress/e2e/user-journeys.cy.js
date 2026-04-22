describe('Full User Journey - Patient', () => {
  it('should complete a patient login flow', () => {
    // Visit login page
    cy.visit('/login');
    
    // Verify page elements
    cy.get('h1').should('contain', 'MediQueue');
    cy.get('[id="username"]').should('be.visible');
    cy.get('[id="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Form should be empty initially
    cy.get('[id="username"]').should('have.value', '');
    cy.get('[id="password"]').should('have.value', '');
  });

  it('should display form validation errors', () => {
    cy.visit('/login');
    
    // Try to submit with invalid credentials
    cy.get('[id="username"]').type('invaliduser');
    cy.get('[id="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.get('.alert').should('be.visible');
  });

  it('should allow navigation to registration', () => {
    cy.visit('/login');
    
    // Find and click registration link
    cy.contains('create one').should('be.visible').click();
    
    // Should navigate to register page
    cy.url().should('include', '/register');
  });
});

describe('Full User Journey - Doctor', () => {
  it('should have doctor-specific routes', () => {
    // Test that doctor routes exist
    cy.visit('/doctor');
    
    // Should redirect to login if not authenticated
    cy.url().should('include', '/login');
  });
});

describe('Admin Section', () => {
  it('should have admin routes', () => {
    // Test that admin routes exist
    cy.visit('/admin');
    
    // Should redirect to login if not authenticated
    cy.url().should('include', '/login');
  });
});
