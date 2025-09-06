describe('Product Search', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  describe('Search Input Component', () => {
    it('should display search input with placeholder text', () => {
      cy.get('app-search-input input').should('be.visible');
      cy.get('app-search-input input').should('have.attr', 'placeholder', 'Search products, brands, categories...');
    });

    it('should show search suggestions when typing', () => {
      cy.get('app-search-input input').type('air');
      
      // Wait for debounced search and suggestions to appear
      cy.get('app-search-input .suggestions', { timeout: 1000 }).should('be.visible');
      cy.get('app-search-input .suggestions div').should('have.length.greaterThan', 0);
    });

    it('should perform search when pressing Enter', () => {
      const searchTerm = 'air conditioner';
      
      cy.get('app-search-input input').type(`${searchTerm}{enter}`);
      
      // Check that search results header shows the search term
      cy.get('app-search-results-header').should('contain.text', searchTerm);
      
      // Check URL contains search parameter
      cy.url().should('include', 'search=' + encodeURIComponent(searchTerm));
    });

    it('should clear search when clicking clear button', () => {
      cy.get('app-search-input input').type('test search');
      cy.get('app-search-input button').click();
      cy.get('app-search-input input').should('have.value', '');
    });
  });

  describe('Header Search Integration', () => {
    it('should navigate to products page when searching from header', () => {
      cy.visit('/');
      
      // Find header search (desktop version)
      cy.get('header app-search-input input').type('solar{enter}');
      
      // Should navigate to products page
      cy.url().should('include', '/products');
      cy.url().should('include', 'search=solar');
    });

    it('should show mobile search on small screens', () => {
      cy.viewport(375, 667); // Mobile viewport
      cy.visit('/');
      
      // Mobile search button should be visible
      cy.get('header button[title="Search"]').should('be.visible');
      
      // Desktop search should be hidden
      cy.get('header app-search-input').should('not.be.visible');
      
      // Click mobile search button
      cy.get('header button[title="Search"]').click();
      
      // Mobile search input should appear
      cy.get('[data-testid="mobile-search"] app-search-input').should('be.visible');
    });
  });

  describe('Product Filters Component', () => {
    it('should display all filter options', () => {
      // Category filter
      cy.get('app-product-filters select').first().should('be.visible');
      cy.get('app-product-filters select').first().should('contain.text', 'All Categories');
      
      // Price range filters
      cy.get('app-product-filters input[type="number"]').should('have.length', 2);
      cy.get('app-product-filters input[placeholder="Min"]').should('be.visible');
      cy.get('app-product-filters input[placeholder="Max"]').should('be.visible');
      
      // Sort by filter
      cy.get('app-product-filters select').eq(1).should('be.visible');
      cy.get('app-product-filters select').eq(1).should('contain.text', 'Newest');
      
      // Availability checkboxes
      cy.get('app-product-filters input[type="checkbox"]').should('have.length', 2);
      cy.get('app-product-filters').should('contain.text', 'In Stock Only');
      cy.get('app-product-filters').should('contain.text', 'Featured Only');
    });

    it('should filter products by category', () => {
      // Select a category
      cy.get('app-product-filters select').first().select(1); // Select first non-empty option
      
      // Check that filters are applied
      cy.get('app-search-results-header').should('contain.text', 'filter');
      
      // Check that product list updates
      cy.get('.product-grid div', { timeout: 5000 }).should('be.visible');
    });

    it('should filter products by price range', () => {
      // Set price range
      cy.get('app-product-filters input[placeholder="Min"]').type('100');
      cy.get('app-product-filters input[placeholder="Max"]').type('500');
      
      // Trigger change event
      cy.get('app-product-filters input[placeholder="Max"]').blur();
      
      // Check that filters are applied
      cy.get('app-search-results-header').should('contain.text', 'filter');
    });

    it('should show active filters summary', () => {
      // Apply some filters
      cy.get('app-product-filters input[placeholder="Min"]').type('100');
      cy.get('app-product-filters input[type="checkbox"]').first().check();
      
      // Should show active filters
      cy.get('app-product-filters').should('contain.text', 'Active Filters');
      cy.get('app-product-filters').should('contain.text', 'Price: $100');
      cy.get('app-product-filters').should('contain.text', 'In Stock Only');
    });

    it('should clear individual filters', () => {
      // Apply price filter
      cy.get('app-product-filters input[placeholder="Min"]').type('100');
      cy.get('app-product-filters input[placeholder="Min"]').blur();
      
      // Clear price filter using × button
      cy.get('app-product-filters button').contains('×').click();
      
      // Price input should be cleared
      cy.get('app-product-filters input[placeholder="Min"]').should('have.value', '');
    });

    it('should clear all filters at once', () => {
      // Apply multiple filters
      cy.get('app-product-filters input[placeholder="Min"]').type('100');
      cy.get('app-product-filters input[type="checkbox"]').first().check();
      
      // Click clear all button
      cy.get('app-product-filters button').contains('Clear All').click();
      
      // All filters should be cleared
      cy.get('app-product-filters input[placeholder="Min"]').should('have.value', '');
      cy.get('app-product-filters input[type="checkbox"]').first().should('not.be.checked');
    });
  });

  describe('Search Results Integration', () => {
    it('should display search results header with correct information', () => {
      const searchTerm = 'solar';
      
      cy.get('app-search-input input').type(`${searchTerm}{enter}`);
      
      // Check search results header
      cy.get('app-search-results-header h1').should('contain.text', `Search Results for "${searchTerm}"`);
      cy.get('app-search-results-header').should('contain.text', 'products found');
    });

    it('should show pagination information', () => {
      // Perform search
      cy.get('app-search-input input').type('air{enter}');
      
      // Check pagination info
      cy.get('app-search-results-header').should('contain.text', 'Showing');
    });

    it('should display "no results" message when no products match', () => {
      const nonExistentSearch = 'xyzabcnonexistent123';
      
      cy.get('app-search-input input').type(`${nonExistentSearch}{enter}`);
      
      // Should show no results message
      cy.get('.empty-state').should('be.visible');
      cy.get('.empty-state').should('contain.text', 'No products found');
    });
  });

  describe('Search User Journeys', () => {
    it('should complete full search and filter workflow', () => {
      // 1. Start with a search
      cy.get('app-search-input input').type('air conditioner{enter}');
      
      // 2. Verify search results
      cy.get('app-search-results-header').should('contain.text', 'Search Results for "air conditioner"');
      
      // 3. Apply additional filters
      cy.get('app-product-filters input[type="checkbox"]').first().check(); // In stock only
      cy.get('app-product-filters select').eq(1).select('price'); // Sort by price
      
      // 4. Verify filters are reflected in results
      cy.get('app-search-results-header').should('contain.text', 'filter');
      
      // 5. Clear search but keep filters
      cy.get('app-search-input button').click(); // Clear search
      
      // 6. Should still show filtered results
      cy.get('app-search-results-header h1').should('contain.text', 'All Products');
      cy.get('app-search-results-header').should('contain.text', 'filter');
    });

    it('should maintain search state when navigating back', () => {
      const searchTerm = 'heat pump';
      
      // Perform search
      cy.get('app-search-input input').type(`${searchTerm}{enter}`);
      
      // Navigate away and back
      cy.get('header a[routerLink="/"]').click();
      cy.get('header a[routerLink="/products"]').click();
      
      // Search should be preserved
      cy.get('app-search-input input').should('have.value', searchTerm);
      cy.get('app-search-results-header').should('contain.text', `Search Results for "${searchTerm}"`);
    });

    it('should handle concurrent search and filter operations', () => {
      // Start typing search
      cy.get('app-search-input input').type('air');
      
      // Immediately apply filter while search is in progress
      cy.get('app-product-filters input[type="checkbox"]').first().check();
      
      // Complete search
      cy.get('app-search-input input').type(' conditioner{enter}');
      
      // Both search and filter should be applied
      cy.get('app-search-results-header').should('contain.text', 'Search Results for "air conditioner"');
      cy.get('app-search-results-header').should('contain.text', 'filter');
    });
  });

  describe('Search Suggestions', () => {
    it('should show relevant suggestions based on input', () => {
      cy.get('app-search-input input').type('air');
      
      // Wait for suggestions
      cy.get('app-search-input .suggestions', { timeout: 1000 }).should('be.visible');
      
      // Suggestions should contain relevant terms
      cy.get('app-search-input .suggestions').should('contain.text', 'air');
    });

    it('should allow selection of suggestions', () => {
      cy.get('app-search-input input').type('air');
      
      // Wait for and click first suggestion
      cy.get('app-search-input .suggestions div').first().click();
      
      // Should trigger search with selected suggestion
      cy.get('app-search-results-header').should('contain.text', 'Search Results');
    });

    it('should navigate suggestions with keyboard', () => {
      cy.get('app-search-input input').type('air');
      
      // Use arrow keys to navigate suggestions
      cy.get('app-search-input input').type('{downarrow}');
      cy.get('app-search-input .suggestions div').first().should('have.class', 'bg-gray-100');
      
      // Press enter to select highlighted suggestion
      cy.get('app-search-input input').type('{enter}');
      
      // Should trigger search
      cy.get('app-search-results-header').should('contain.text', 'Search Results');
    });
  });
});