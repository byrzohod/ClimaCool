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

// Cart-specific custom commands
Cypress.Commands.add('addToCart', (productName: string) => {
  cy.contains('[data-testid^="add-to-cart"]', 'Add to Cart').click();
  cy.contains('Added to cart').should('be.visible');
});

Cypress.Commands.add('openCartSidebar', () => {
  cy.get('[data-testid="cart-icon-button"]').click();
  cy.get('[data-testid="cart-sidebar"]').should('be.visible');
});

Cypress.Commands.add('closeCartSidebar', () => {
  cy.get('[data-testid="close-cart"]').click();
  cy.get('[data-testid="cart-sidebar"]').should('not.be.visible');
});

declare global {
  namespace Cypress {
    interface Chainable {
      addToCart(productName: string): Chainable<void>;
      openCartSidebar(): Chainable<void>;
      closeCartSidebar(): Chainable<void>;
    }
  }
}