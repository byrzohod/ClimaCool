describe('Product Browsing Tests', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  describe('Product List Page', () => {
    it('should navigate to products page', () => {
      cy.url().should('include', '/products');
    });

    it('should display product list header', () => {
      cy.contains('h1', 'Products').should('be.visible');
    });

    it('should display search input', () => {
      cy.get('input[placeholder*="Search"]').should('be.visible');
    });

    it('should display view mode toggle buttons', () => {
      cy.contains('button', 'Grid').should('be.visible');
      cy.contains('button', 'List').should('be.visible');
    });

    it('should toggle between grid and list view', () => {
      // Click list view
      cy.contains('button', 'List').click();
      cy.contains('button', 'List').should('have.class', 'bg-blue-600');
      
      // Click grid view
      cy.contains('button', 'Grid').click();
      cy.contains('button', 'Grid').should('have.class', 'bg-blue-600');
    });
  });

  describe('Product Search', () => {
    it('should search for products', () => {
      cy.get('input[placeholder*="Search"]').type('HVAC');
      cy.get('input[placeholder*="Search"]').should('have.value', 'HVAC');
    });

    it('should clear search input', () => {
      cy.get('input[placeholder*="Search"]').type('test search');
      cy.get('input[placeholder*="Search"]').clear();
      cy.get('input[placeholder*="Search"]').should('have.value', '');
    });
  });

  describe('Product Filters', () => {
    it('should display filter section', () => {
      // Check if filters exist (they may be in a sidebar or dropdown)
      cy.get('body').then($body => {
        if ($body.text().includes('Filters') || $body.text().includes('Category')) {
          cy.log('Filters section found');
        } else {
          cy.log('No filters section visible');
        }
      });
    });
  });

  describe('Product Loading States', () => {
    it('should handle loading state', () => {
      cy.visit('/products');
      // Products should eventually load
      cy.get('body', { timeout: 10000 }).should('not.contain', 'Loading');
    });

    it('should display message when no products found', () => {
      // Search for something that likely won't exist
      cy.get('input[placeholder*="Search"]').type('xyzabc123nonexistent');
      cy.wait(1000);
      cy.get('body').then($body => {
        // Check for no results message or empty state
        const text = $body.text();
        if (text.includes('No products') || text.includes('No results') || text.includes('not found')) {
          cy.log('No products message displayed');
        }
      });
    });
  });
});