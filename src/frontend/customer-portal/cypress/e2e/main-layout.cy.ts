describe('Main Layout E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Header', () => {
    it('should display the header with logo', () => {
      cy.get('[data-testid="main-header"]').should('be.visible');
      cy.get('[data-testid="logo-link"]').should('be.visible');
      cy.get('[data-testid="logo-link"]').should('contain', 'ClimaCool');
    });

    it('should display cart icon with badge', () => {
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
      cy.get('[data-testid="cart-badge"]').should('be.visible');
      cy.get('[data-testid="cart-badge"]').should('contain', '0');
    });
  });

  describe('Main Content', () => {
    it('should display main content area', () => {
      // Main content is now dynamic based on route
      cy.get('main').should('be.visible');
    });

    it('should render router outlet content', () => {
      // Router outlet renders the current route's component
      cy.visit('/products');
      cy.contains('Products').should('be.visible');
    });
  });

  describe('Cart Sidebar', () => {
    it('should not display cart sidebar initially', () => {
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      cy.get('[data-testid="cart-overlay"]').should('not.exist');
    });

    it('should open cart sidebar when cart icon is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="cart-overlay"]').should('be.visible');
    });

    it('should display empty cart message when cart is empty', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').within(() => {
        cy.contains('Shopping Cart').should('be.visible');
        cy.contains('Your cart is empty').should('be.visible');
        cy.contains('Add some items to get started').should('be.visible');
        cy.contains('button', 'Continue Shopping').should('be.visible');
      });
    });

    it('should close cart sidebar when close button is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="close-cart"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      cy.get('[data-testid="cart-overlay"]').should('not.exist');
    });

    it('should close cart sidebar when overlay is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="cart-overlay"]').click({ force: true });
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      cy.get('[data-testid="cart-overlay"]').should('not.exist');
    });

    it('should close cart sidebar when Continue Shopping button is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.contains('button', 'Continue Shopping').click();
      cy.get('[data-testid="cart-sidebar"]').should('not.exist');
      cy.get('[data-testid="cart-overlay"]').should('not.exist');
    });
  });

  describe('Responsive Design', () => {
    it('should display properly on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="main-header"]').should('be.visible');
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
      cy.get('main').should('be.visible');
    });

    it('should display properly on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="main-header"]').should('be.visible');
      cy.get('[data-testid="cart-icon-button"]').should('be.visible');
      cy.get('main').should('be.visible');
    });
  });
});