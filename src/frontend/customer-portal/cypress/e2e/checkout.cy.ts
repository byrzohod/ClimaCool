describe('Checkout Flow', () => {
  beforeEach(() => {
    // Set up test data and authentication if needed
    cy.visit('/products');
    
    // Add items to cart first
    cy.addItemToCart('test-product-1', 2);
    cy.addItemToCart('test-product-2', 1);
  });

  describe('Cart to Checkout Navigation', () => {
    it('should navigate from cart sidebar to checkout', () => {
      // Open cart sidebar
      cy.get('[data-testid="cart-icon"]').click();
      
      // Verify cart sidebar is open
      cy.get('[data-testid="cart-sidebar"]').should('be.visible');
      cy.get('[data-testid="cart-items-list"]').should('contain', 'test-product-1');
      
      // Click checkout button
      cy.get('[data-testid="checkout-button"]').click();
      
      // Verify navigation to checkout page
      cy.url().should('include', '/checkout');
      cy.get('[data-testid="checkout-title"]').should('be.visible');
    });

    it('should navigate from cart page to checkout', () => {
      // Navigate to cart page
      cy.visit('/cart');
      
      // Verify cart page contents
      cy.get('[data-testid="cart-title"]').should('be.visible');
      cy.get('[data-testid="cart-items-list"]').should('contain', 'test-product-1');
      
      // Click proceed to checkout
      cy.get('[data-testid="checkout-button"]').click();
      
      // Verify navigation to checkout
      cy.url().should('include', '/checkout');
    });
  });

  describe('Step 1: Shipping Address', () => {
    beforeEach(() => {
      cy.visit('/checkout');
    });

    it('should display step 1 shipping address form', () => {
      // Verify we're on step 1
      cy.get('[data-testid="checkout-step-1-current"]').should('be.visible');
      cy.get('[data-testid="checkout-step-shipping"]').should('be.visible');
      
      // Verify address form is visible
      cy.get('[data-testid="checkout-shipping-form"]').should('be.visible');
      cy.get('[data-testid="checkout-first-name"]').should('be.visible');
      cy.get('[data-testid="checkout-last-name"]').should('be.visible');
    });

    it('should validate required shipping address fields', () => {
      // Try to continue without filling required fields
      cy.get('[data-testid="checkout-continue-button"]').should('be.disabled');
      
      // Fill only first name
      cy.get('[data-testid="checkout-first-name"]').type('John');
      cy.get('[data-testid="checkout-continue-button"]').should('be.disabled');
      
      // Fill remaining required fields
      cy.fillShippingAddress({
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'US'
      });
      
      // Continue button should be enabled
      cy.get('[data-testid="checkout-continue-button"]').should('not.be.disabled');
    });

    it('should handle same as shipping checkbox', () => {
      cy.fillShippingAddress();
      
      // Same as shipping should be checked by default
      cy.get('[data-testid="checkout-same-as-shipping"]').should('be.checked');
      cy.get('[data-testid="checkout-billing-section"]').should('not.exist');
      
      // Uncheck same as shipping
      cy.get('[data-testid="checkout-same-as-shipping"]').uncheck();
      cy.get('[data-testid="checkout-billing-section"]').should('be.visible');
      cy.get('[data-testid="checkout-billing-form"]').should('be.visible');
      
      // Check it again
      cy.get('[data-testid="checkout-same-as-shipping"]').check();
      cy.get('[data-testid="checkout-billing-section"]').should('not.exist');
    });

    it('should validate billing address when different from shipping', () => {
      cy.fillShippingAddress();
      
      // Uncheck same as shipping
      cy.get('[data-testid="checkout-same-as-shipping"]').uncheck();
      
      // Continue should be disabled without billing address
      cy.get('[data-testid="checkout-continue-button"]').should('be.disabled');
      
      // Fill billing address
      cy.fillBillingAddress({
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Ave',
        city: 'Another City',
        state: 'NY',
        postalCode: '54321',
        country: 'US'
      });
      
      // Continue should be enabled
      cy.get('[data-testid="checkout-continue-button"]').should('not.be.disabled');
    });

    it('should save order notes', () => {
      cy.fillShippingAddress();
      
      const notes = 'Please leave at front door';
      cy.get('[data-testid="checkout-notes"]').type(notes);
      
      // Continue to next step
      cy.get('[data-testid="checkout-continue-button"]').click();
      
      // Go back to verify notes are saved
      cy.get('[data-testid="checkout-back-button"]').click();
      cy.get('[data-testid="checkout-notes"]').should('have.value', notes);
    });
  });

  describe('Step 2: Review Order', () => {
    beforeEach(() => {
      cy.visit('/checkout');
      cy.fillShippingAddress();
      cy.get('[data-testid="checkout-continue-button"]').click();
    });

    it('should display step 2 review order', () => {
      // Verify we're on step 2
      cy.get('[data-testid="checkout-step-2-current"]').should('be.visible');
      cy.get('[data-testid="checkout-step-review"]').should('be.visible');
      
      // Verify address summary is displayed
      cy.get('[data-testid="checkout-review-shipping"]').should('contain', 'John Doe');
      cy.get('[data-testid="checkout-review-billing"]').should('contain', 'Same as shipping');
    });

    it('should display order summary with correct totals', () => {
      // Verify order summary is present
      cy.get('[data-testid="checkout-order-summary"]').should('be.visible');
      
      // Verify cart items are displayed
      cy.get('[data-testid="checkout-order-item"]').should('have.length.at.least', 1);
      
      // Verify totals
      cy.get('[data-testid="checkout-subtotal"]').should('be.visible');
      cy.get('[data-testid="checkout-tax"]').should('be.visible');
      cy.get('[data-testid="checkout-shipping"]').should('be.visible');
      cy.get('[data-testid="checkout-total"]').should('be.visible');
    });

    it('should allow going back to step 1', () => {
      cy.get('[data-testid="checkout-back-button"]').click();
      
      // Should be back on step 1
      cy.get('[data-testid="checkout-step-1-current"]').should('be.visible');
      cy.get('[data-testid="checkout-step-shipping"]').should('be.visible');
    });

    it('should place order successfully', () => {
      // Mock successful order creation
      cy.intercept('POST', '/api/checkout/create-order', {
        statusCode: 201,
        body: {
          id: 'order-123',
          orderNumber: 'ORD-001',
          status: 'Processing',
          totalAmount: 99.99,
          createdAt: new Date().toISOString()
        }
      }).as('createOrder');
      
      cy.get('[data-testid="checkout-place-order-button"]').click();
      
      // Verify API call
      cy.wait('@createOrder');
      
      // Should navigate to confirmation step
      cy.get('[data-testid="checkout-step-3-current"]').should('be.visible');
      cy.get('[data-testid="checkout-step-confirmation"]').should('be.visible');
    });

    it('should handle order creation error', () => {
      // Mock failed order creation
      cy.intercept('POST', '/api/checkout/create-order', {
        statusCode: 400,
        body: { message: 'Payment failed' }
      }).as('createOrderError');
      
      cy.get('[data-testid="checkout-place-order-button"]').click();
      
      // Verify error message is displayed
      cy.wait('@createOrderError');
      cy.get('[data-testid="checkout-error-message"]').should('be.visible');
      cy.get('[data-testid="checkout-error-message"]').should('contain', 'Payment failed');
    });
  });

  describe('Step 3: Order Confirmation', () => {
    beforeEach(() => {
      cy.completeCheckout();
    });

    it('should display order confirmation', () => {
      // Verify we're on step 3
      cy.get('[data-testid="checkout-step-3-current"]').should('be.visible');
      cy.get('[data-testid="checkout-step-confirmation"]').should('be.visible');
      
      // Verify success message and order number
      cy.get('[data-testid="checkout-order-number"]').should('be.visible');
      cy.get('[data-testid="checkout-order-number"]').should('contain', 'ORD-');
    });

    it('should navigate to order details', () => {
      cy.intercept('GET', '/api/checkout/orders/*', {
        statusCode: 200,
        body: {
          id: 'order-123',
          orderNumber: 'ORD-001',
          status: 'Processing',
          items: [],
          shippingAddress: {},
          billingAddress: {}
        }
      }).as('getOrder');
      
      cy.get('[data-testid="checkout-view-order"]').click();
      
      // Should navigate to order details page
      cy.url().should('include', '/orders/');
      cy.wait('@getOrder');
    });

    it('should continue shopping', () => {
      cy.get('[data-testid="checkout-continue-shopping"]').click();
      
      // Should navigate back to products
      cy.url().should('include', '/products');
    });
  });

  describe('Order Details Page', () => {
    it('should display order details', () => {
      const orderId = 'order-123';
      
      cy.intercept('GET', `/api/checkout/orders/${orderId}`, {
        statusCode: 200,
        body: {
          id: orderId,
          orderNumber: 'ORD-001',
          status: 'Processing',
          subTotal: 80.00,
          taxAmount: 6.40,
          shippingAmount: 15.00,
          totalAmount: 101.40,
          items: [
            {
              id: 1,
              productName: 'Test Product 1',
              quantity: 2,
              price: 25.00,
              totalPrice: 50.00
            }
          ],
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US'
          },
          billingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US'
          },
          createdAt: new Date().toISOString()
        }
      }).as('getOrderDetails');
      
      cy.visit(`/orders/${orderId}`);
      
      // Verify order details are displayed
      cy.wait('@getOrderDetails');
      cy.get('[data-testid="order-details-title"]').should('be.visible');
      cy.get('[data-testid="order-status"]').should('contain', 'Processing');
      cy.get('[data-testid="order-total"]').should('contain', '$101.40');
      
      // Verify addresses
      cy.get('[data-testid="shipping-address"]').should('contain', 'John Doe');
      cy.get('[data-testid="billing-address"]').should('contain', 'John Doe');
      
      // Verify items
      cy.get('[data-testid="order-item"]').should('have.length', 1);
    });

    it('should handle order not found', () => {
      const orderId = 'nonexistent-order';
      
      cy.intercept('GET', `/api/checkout/orders/${orderId}`, {
        statusCode: 404,
        body: { message: 'Order not found' }
      }).as('getOrderNotFound');
      
      cy.visit(`/orders/${orderId}`);
      
      cy.wait('@getOrderNotFound');
      cy.get('[data-testid="checkout-error-message"]').should('be.visible');
      cy.get('[data-testid="checkout-error-message"]').should('contain', 'Order not found');
    });
  });

  describe('Mobile Responsive Design', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should work on mobile devices', () => {
      cy.visit('/checkout');
      
      // Verify mobile layout
      cy.get('[data-testid="checkout-title"]').should('be.visible');
      cy.get('[data-testid="checkout-steps"]').should('be.visible');
      
      // Fill form on mobile
      cy.fillShippingAddress();
      cy.get('[data-testid="checkout-continue-button"]').click();
      
      // Verify review step on mobile
      cy.get('[data-testid="checkout-step-review"]').should('be.visible');
      cy.get('[data-testid="checkout-order-summary"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty cart redirect', () => {
      // Mock empty cart
      cy.intercept('GET', '/api/cart', {
        statusCode: 200,
        body: { items: [], subTotal: 0, totalAmount: 0 }
      });
      
      cy.visit('/checkout');
      
      // Should redirect to cart page
      cy.url().should('include', '/cart');
    });

    it('should handle network errors gracefully', () => {
      cy.visit('/checkout');
      cy.fillShippingAddress();
      cy.get('[data-testid="checkout-continue-button"]').click();
      
      // Mock network error
      cy.intercept('POST', '/api/checkout/create-order', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('serverError');
      
      cy.get('[data-testid="checkout-place-order-button"]').click();
      
      cy.wait('@serverError');
      cy.get('[data-testid="checkout-error-message"]').should('be.visible');
    });
  });
});

// Custom Cypress commands for checkout flow
declare global {
  namespace Cypress {
    interface Chainable {
      fillShippingAddress(address?: Partial<Address>): Chainable<void>;
      fillBillingAddress(address?: Partial<Address>): Chainable<void>;
      addItemToCart(productId: string, quantity: number): Chainable<void>;
      completeCheckout(): Chainable<void>;
    }
  }
}

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}