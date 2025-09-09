describe('Shopping Cart Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Cart Icon and Sidebar', () => {
    it('should display cart icon in header', () => {
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
    });

    it('should display cart badge with count', () => {
      cy.get('[data-testid="cart-badge"]').should('be.visible');
      cy.get('[data-testid="cart-badge"]').should('contain', '0');
    });

    it('should open cart sidebar when clicking cart icon', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    });

    it('should close cart sidebar when clicking close button', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="close-cart"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });

    it('should close cart sidebar when clicking overlay', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="cart-overlay"]').click({ force: true });
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });
  });

  describe('Empty Cart State', () => {
    it('should display empty cart message', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.contains('Your cart is empty').should('be.visible');
    });

    it('should display continue shopping button', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.contains('button', 'Continue Shopping').should('be.visible');
    });

    it('should close cart when clicking continue shopping', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.contains('button', 'Continue Shopping').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });
  });

  describe('Cart Page Navigation', () => {
    it('should navigate to cart page', () => {
      cy.visit('/cart');
      cy.url().should('include', '/cart');
    });

    it('should display cart page content', () => {
      cy.visit('/cart');
      // Page should load without errors
      cy.get('body').should('be.visible');
    });
  });

  describe('Cart Functionality with Custom Commands', () => {
    it('should use custom command to open cart', () => {
      cy.openCartSidebar();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
    });

    it('should use custom command to close cart', () => {
      cy.openCartSidebar();
      cy.closeCartSidebar();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart state on page reload', () => {
      // Open cart to verify initial state
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.contains('Your cart is empty').should('be.visible');
      cy.get('[data-testid="close-cart"]').click();
      
      // Reload page
      cy.reload();
      
      // Cart should still be accessible
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
      cy.get('[data-testid="cart-badge"]').should('contain', '0');
    });
  });
});