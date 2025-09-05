describe('Shopping Cart E2E User Journeys', () => {
  beforeEach(() => {
    // Mock API endpoints
    cy.intercept('GET', '/api/products*', { fixture: 'products.json' }).as('getProducts');
    cy.intercept('POST', '/api/cart/add', { fixture: 'cart.json' }).as('addToCart');
    cy.intercept('GET', '/api/cart', { fixture: 'cart.json' }).as('getCart');
    cy.intercept('GET', '/api/cart/summary', { 
      body: { itemCount: 1, subTotal: 2499.99 }
    }).as('getCartSummary');
    cy.intercept('PUT', '/api/cart/items/*', { fixture: 'cart.json' }).as('updateCartItem');
    cy.intercept('DELETE', '/api/cart/items/*', { 
      body: { itemCount: 0, subTotal: 0 }
    }).as('removeCartItem');

    // Visit the homepage
    cy.visit('/');
  });

  describe('Cart Icon and Badge', () => {
    it('should display cart icon in header', () => {
      cy.get('[data-testid="cart-icon-button"]')
        .should('be.visible')
        .and('contain.attr', 'title')
        .and('include', 'Shopping cart');
    });

    it('should show badge with item count when cart has items', () => {
      // Simulate cart with items
      cy.intercept('GET', '/api/cart/summary', { 
        body: { itemCount: 3, subTotal: 7499.99 }
      }).as('getCartSummaryWithItems');
      
      cy.reload();
      cy.wait('@getCartSummaryWithItems');
      
      cy.get('[data-testid="cart-badge"]')
        .should('be.visible')
        .and('contain.text', '3');
    });

    it('should show "99+" for cart with more than 99 items', () => {
      cy.intercept('GET', '/api/cart/summary', { 
        body: { itemCount: 150, subTotal: 99999.99 }
      }).as('getCartSummaryMany');
      
      cy.reload();
      cy.wait('@getCartSummaryMany');
      
      cy.get('[data-testid="cart-badge"]')
        .should('be.visible')
        .and('contain.text', '99+');
    });
  });

  describe('Product List - Add to Cart', () => {
    beforeEach(() => {
      cy.visit('/products');
      cy.wait('@getProducts');
    });

    it('should display Add to Cart buttons on product cards', () => {
      cy.get('[data-testid^="add-to-cart-"]')
        .should('have.length.at.least', 1)
        .first()
        .should('be.visible')
        .and('contain.text', 'Add to Cart');
    });

    it('should disable Add to Cart button for out-of-stock products', () => {
      cy.get('[data-testid="add-to-cart-3"]') // Product ID 3 is out of stock in fixture
        .should('be.disabled')
        .and('contain.text', 'Out of Stock');
    });

    it('should add product to cart successfully', () => {
      cy.get('[data-testid="add-to-cart-1"]')
        .should('not.be.disabled')
        .click();
      
      cy.wait('@addToCart');
      
      // Cart badge should update
      cy.get('[data-testid="cart-badge"]')
        .should('be.visible')
        .and('contain.text', '1');
      
      // Cart sidebar should open automatically
      cy.get('[data-testid="cart-sidebar"]')
        .should('be.visible');
    });

    it('should show loading state while adding to cart', () => {
      // Delay the API response to see loading state
      cy.intercept('POST', '/api/cart/add', { 
        fixture: 'cart.json',
        delay: 1000 
      }).as('addToCartSlow');
      
      cy.get('[data-testid="add-to-cart-1"]').click();
      
      // Should show loading spinner
      cy.get('[data-testid="add-to-cart-1"]')
        .find('.animate-spin')
        .should('be.visible');
      
      cy.wait('@addToCartSlow');
    });
  });

  describe('Cart Sidebar', () => {
    it('should open cart sidebar when cart icon is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      
      cy.get('[data-testid="cart-sidebar"]')
        .should('be.visible');
      
      cy.get('[data-testid="cart-overlay"]')
        .should('be.visible');
    });

    it('should close cart sidebar when close button is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      
      cy.get('[data-testid="close-cart"]').click();
      
      cy.get('[data-testid="cart-sidebar"]')
        .should('not.be.visible');
    });

    it('should close cart sidebar when overlay is clicked', () => {
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      
      cy.get('[data-testid="cart-overlay"]').click();
      
      cy.get('[data-testid="cart-sidebar"]')
        .should('not.be.visible');
    });

    it('should display empty cart message when cart is empty', () => {
      cy.intercept('GET', '/api/cart', { 
        body: { items: [], itemCount: 0, subTotal: 0 }
      }).as('getEmptyCart');
      
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.wait('@getEmptyCart');
      
      cy.contains('Your cart is empty').should('be.visible');
      cy.contains('Continue Shopping').should('be.visible');
    });

    it('should display cart items when cart has products', () => {
      cy.intercept('GET', '/api/cart', { fixture: 'cart.json' }).as('getCartWithItems');
      
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.wait('@getCartWithItems');
      
      cy.get('[data-testid="cart-items-list"]')
        .should('be.visible');
      
      cy.contains('Central Air Conditioner 3.5 Ton')
        .should('be.visible');
      
      cy.get('[data-testid="cart-subtotal"]')
        .should('contain.text', '$2,499.99');
    });
  });

  describe('Cart Item Management', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/cart', { fixture: 'cart.json' }).as('getCartWithItems');
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.wait('@getCartWithItems');
    });

    it('should update item quantity', () => {
      // Test increase quantity
      cy.get('[data-testid="increase-quantity"]').click();
      cy.wait('@updateCartItem');
      
      // Verify quantity input shows updated value
      cy.get('[data-testid="quantity-input"]')
        .should('have.value', '2');
    });

    it('should decrease item quantity', () => {
      // First increase to 2, then decrease
      cy.get('[data-testid="increase-quantity"]').click();
      cy.wait('@updateCartItem');
      
      cy.get('[data-testid="decrease-quantity"]').click();
      cy.wait('@updateCartItem');
      
      cy.get('[data-testid="quantity-input"]')
        .should('have.value', '1');
    });

    it('should not allow quantity below 1', () => {
      cy.get('[data-testid="decrease-quantity"]')
        .should('be.disabled');
    });

    it('should remove item from cart', () => {
      cy.get('[data-testid="remove-item"]').click();
      cy.wait('@removeCartItem');
      
      // Should show empty cart message
      cy.contains('Your cart is empty').should('be.visible');
    });

    it('should update subtotal when quantities change', () => {
      cy.intercept('PUT', '/api/cart/items/*', { 
        body: {
          items: [
            {
              id: 1,
              productId: 1,
              productName: 'Central Air Conditioner 3.5 Ton',
              productImageUrl: '/assets/images/products/ac-central-3-5-ton.jpg',
              unitPrice: 2499.99,
              quantity: 2,
              totalPrice: 4999.98
            }
          ],
          itemCount: 2,
          subTotal: 4999.98
        }
      }).as('updateCartItemDouble');
      
      cy.get('[data-testid="increase-quantity"]').click();
      cy.wait('@updateCartItemDouble');
      
      cy.get('[data-testid="cart-subtotal"]')
        .should('contain.text', '$4,999.98');
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full cart workflow: browse → add → modify → checkout', () => {
      // Step 1: Browse products
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Step 2: Add product to cart
      cy.get('[data-testid="add-to-cart-1"]').click();
      cy.wait('@addToCart');
      
      // Step 3: Verify cart opens with product
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.contains('Central Air Conditioner 3.5 Ton').should('be.visible');
      
      // Step 4: Modify quantity
      cy.get('[data-testid="increase-quantity"]').click();
      cy.wait('@updateCartItem');
      
      // Step 5: Verify updated subtotal
      cy.get('[data-testid="cart-subtotal"]').should('be.visible');
      
      // Step 6: Proceed to checkout (currently just logs)
      cy.get('[data-testid="checkout-button"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
      
      // For now, just verify the button works (actual checkout navigation would be tested when implemented)
    });

    it('should maintain cart state across page navigation', () => {
      // Add item to cart on products page
      cy.visit('/products');
      cy.wait('@getProducts');
      cy.get('[data-testid="add-to-cart-1"]').click();
      cy.wait('@addToCart');
      
      // Navigate to different page
      cy.visit('/about');
      
      // Verify cart badge still shows item count
      cy.get('[data-testid="cart-badge"]')
        .should('be.visible')
        .and('contain.text', '1');
      
      // Verify cart contents are preserved
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.wait('@getCart');
      cy.contains('Central Air Conditioner 3.5 Ton').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      // Cart icon should be visible on mobile
      cy.get('[data-testid="cart-icon-button"]')
        .should('be.visible');
      
      // Add to cart should work on mobile
      cy.get('[data-testid="add-to-cart-1"]').click();
      cy.wait('@addToCart');
      
      // Cart sidebar should work on mobile
      cy.get('[data-testid="cart-sidebar"]')
        .should('be.visible');
    });

    it('should work correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="add-to-cart-1"]').click();
      cy.wait('@addToCart');
      
      cy.get('[data-testid="cart-sidebar"]')
        .should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle add to cart API errors gracefully', () => {
      cy.intercept('POST', '/api/cart/add', { 
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('addToCartError');
      
      cy.visit('/products');
      cy.wait('@getProducts');
      
      cy.get('[data-testid="add-to-cart-1"]').click();
      cy.wait('@addToCartError');
      
      // Should show error state (implementation would depend on error handling in components)
      // For now, verify the button is no longer loading
      cy.get('[data-testid="add-to-cart-1"]')
        .find('.animate-spin')
        .should('not.exist');
    });

    it('should handle cart loading errors', () => {
      cy.intercept('GET', '/api/cart', { 
        statusCode: 500,
        body: { message: 'Failed to load cart' }
      }).as('getCartError');
      
      cy.get('[data-testid="cart-icon-button"]').click();
      cy.wait('@getCartError');
      
      // Should show error message in sidebar
      cy.contains('error', { matchCase: false }).should('be.visible');
    });
  });
});