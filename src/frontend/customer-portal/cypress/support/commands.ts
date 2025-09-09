/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Authentication custom commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
});

Cypress.Commands.add('register', (userData: any) => {
  cy.visit('/auth/register');
  cy.get('[data-testid="firstname-input"]').type(userData.firstName);
  cy.get('[data-testid="lastname-input"]').type(userData.lastName);
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.password);
  if (userData.acceptTerms) {
    cy.get('[data-testid="accept-terms"]').check();
  }
  cy.get('[data-testid="register-submit"]').click();
});

Cypress.Commands.add('checkAuthToken', () => {
  cy.window().its('localStorage.access_token').should('exist');
});

Cypress.Commands.add('clearAuthData', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('access_token');
    win.localStorage.removeItem('refresh_token');
    win.localStorage.removeItem('user');
  });
});

// Cart-specific custom commands
Cypress.Commands.add('openCartSidebar', () => {
  cy.get('[data-testid="cart-icon-button"]').click();
  cy.get('[data-testid="cart-sidebar"]').should('be.visible');
});

Cypress.Commands.add('closeCartSidebar', () => {
  cy.get('[data-testid="close-cart"]').click();
  cy.get('[data-testid="cart-sidebar"]').should('not.exist');
});

// Product custom commands
Cypress.Commands.add('addProductToCart', (productId: string) => {
  cy.get(`[data-testid="product-${productId}"]`).within(() => {
    cy.get('[data-testid="add-to-cart"]').click();
  });
});

Cypress.Commands.add('searchProducts', (searchTerm: string) => {
  cy.get('[data-testid="search-input"]').type(searchTerm);
  cy.get('[data-testid="search-submit"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      register(userData: any): Chainable<void>;
      checkAuthToken(): Chainable<void>;
      clearAuthData(): Chainable<void>;
      openCartSidebar(): Chainable<void>;
      closeCartSidebar(): Chainable<void>;
      addProductToCart(productId: string): Chainable<void>;
      searchProducts(searchTerm: string): Chainable<void>;
    }
  }
}