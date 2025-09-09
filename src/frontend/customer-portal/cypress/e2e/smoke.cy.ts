describe('Smoke Tests', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('ClimaCool').should('be.visible');
  });

  it('should have navigation menu', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
  });

  it('should navigate to products page', () => {
    cy.visit('/products');
    // Check if we're on products page or get redirected
    cy.url().should('include', 'product');
  });

  it('should have cart icon', () => {
    cy.visit('/');
    cy.get('[data-testid="cart-icon-button"]').should('be.visible');
  });
});