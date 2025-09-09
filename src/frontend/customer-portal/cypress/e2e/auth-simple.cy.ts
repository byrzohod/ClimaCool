describe('Authentication Tests - Simple', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Page', () => {
    it('should navigate to login page', () => {
      cy.visit('/auth/login');
      cy.url().should('include', '/auth/login');
    });

    it('should display login form elements', () => {
      cy.visit('/auth/login');
      // Check for login form elements using actual IDs from the HTML
      cy.get('#emailOrUsername').should('be.visible');
      cy.get('#password').should('be.visible');
      cy.get('button[type="submit"]').contains('Sign in').should('be.visible');
    });

    it('should have link to register page', () => {
      cy.visit('/auth/login');
      cy.contains('create a new account').should('be.visible');
    });

    it('should have forgot password link', () => {
      cy.visit('/auth/login');
      cy.contains('Forgot your password?').should('be.visible');
    });
  });

  describe('Registration Page', () => {
    it('should navigate to registration page', () => {
      cy.visit('/auth/register');
      cy.url().should('include', '/auth/register');
    });

    it('should display registration form elements', () => {
      cy.visit('/auth/register');
      // Check for typical registration form fields
      cy.get('input').should('have.length.at.least', 3); // At least email, password, confirm password
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should have link to login page', () => {
      cy.visit('/auth/register');
      cy.contains('Already have an account?').should('be.visible');
    });
  });

  describe('Basic Authentication Flow', () => {
    it('should attempt login with test credentials', () => {
      cy.visit('/auth/login');
      
      // Find and fill email field using actual ID
      cy.get('#emailOrUsername').type('test@example.com');
      
      // Find and fill password field using actual ID
      cy.get('#password').type('TestPassword123!');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Check for any response - could be error or success
      cy.wait(1000);
      // Either we get redirected or see an error message
      cy.url().then(url => {
        if (url.includes('/auth/login')) {
          // Still on login page, check for error message
          cy.contains(/invalid|incorrect|error|failed/i).should('be.visible');
        } else {
          // Redirected, login might have worked
          cy.log('Redirected from login page');
        }
      });
    });

    it('should show validation on empty form submission', () => {
      cy.visit('/auth/login');
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation messages
      cy.contains('Email or username is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });
  });
});