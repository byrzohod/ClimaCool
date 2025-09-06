describe('Shopping Cart E2E Tests', () => {
  beforeEach(() => {
    // Mock cart API endpoints to avoid backend dependencies
    cy.intercept('GET', '/api/cart/summary', { 
      body: { itemCount: 0, subTotal: 0 }
    }).as('getCartSummary');
    
    cy.intercept('GET', '/api/cart', { 
      body: { items: [], itemCount: 0, subTotal: 0 }
    }).as('getCart');
  });

  it('should load the application', () => {
    cy.visit('/');
    cy.get('[data-testid="main-header"]').should('be.visible');
    cy.get('[data-testid="logo-link"]').should('be.visible');
  });

  it('should display cart icon in header', () => {
    cy.visit('/');
    cy.get('[data-testid="cart-icon-button"]', { timeout: 10000 })
      .should('be.visible');
  });

  it('should open cart sidebar when cart icon is clicked', () => {
    cy.visit('/');
    cy.get('[data-testid="cart-icon-button"]').click();
    cy.get('[data-testid="cart-sidebar"]').should('be.visible');
  });

  it('should close cart sidebar when close button is clicked', () => {
    cy.visit('/');
    cy.get('[data-testid="cart-icon-button"]').click();
    cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    cy.get('[data-testid="close-cart"]').click();
    cy.get('[data-testid="cart-sidebar"]').should('not.exist');
  });

  it('should display empty cart message', () => {
    cy.visit('/');
    cy.get('[data-testid="cart-icon-button"]').click();
    cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    cy.contains('Your cart is empty').should('be.visible');
  });
});