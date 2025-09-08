describe('Shopping Cart Sidebar E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Cart Icon', () => {
    it('should display cart icon in header', () => {
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
    });

    it('should display cart badge with zero items', () => {
      cy.get('[data-testid="cart-badge"]').should('be.visible');
      cy.get('[data-testid="cart-badge"]').should('contain', '0');
    });

    it('should have hover effect on cart icon', () => {
      cy.get('[data-testid="cart-icon-button"]')
        .should('have.class', 'hover:text-gray-900');
    });
  });

  describe('Cart Sidebar Toggle', () => {
    it('should open cart sidebar when cart icon is clicked', () => {
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    });

    it('should display overlay when cart is open', () => {
      cy.get('[data-testid="cart-overlay"]').should('not.exist');
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-overlay"]').should('be.visible');
    });

    it('should close cart sidebar when close button is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="close-cart"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });

    it('should close cart sidebar when overlay is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="cart-overlay"]').click({ force: true });
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });

    it('should toggle cart sidebar on multiple clicks', () => {
      // Open
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      
      // Close
      cy.get('[data-testid="close-cart"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      
      // Open again
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    });
  });

  describe('Empty Cart State', () => {
    it('should display empty cart message', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').within(() => {
        cy.contains('Your cart is empty').should('be.visible');
        cy.contains('Add some items to get started').should('be.visible');
      });
    });

    it('should display cart icon in empty state', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').within(() => {
        // Check for the cart SVG icon
        cy.get('svg').should('exist');
      });
    });

    it('should display Continue Shopping button', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').within(() => {
        cy.contains('button', 'Continue Shopping').should('be.visible');
      });
    });

    it('should close cart when Continue Shopping is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.contains('button', 'Continue Shopping').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });
  });

  describe('Cart Header', () => {
    it('should display Shopping Cart title', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').within(() => {
        cy.contains('Shopping Cart').should('be.visible');
      });
    });

    it('should display close button with X icon', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="close-cart"]').should('be.visible');
      cy.get('[data-testid="close-cart"]').within(() => {
        cy.get('svg').should('exist');
      });
    });
  });
});