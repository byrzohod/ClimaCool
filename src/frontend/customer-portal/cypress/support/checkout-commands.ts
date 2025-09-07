// Custom Cypress commands for checkout flow testing

Cypress.Commands.add('fillShippingAddress', (address = {}) => {
  const defaultAddress = {
    firstName: 'John',
    lastName: 'Doe',
    company: '',
    addressLine1: '123 Main St',
    addressLine2: '',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'US',
    phoneNumber: '555-123-4567',
    ...address
  };

  // Fill shipping address form
  cy.get('[data-testid="checkout-first-name"]').clear().type(defaultAddress.firstName);
  cy.get('[data-testid="checkout-last-name"]').clear().type(defaultAddress.lastName);
  
  if (defaultAddress.company) {
    cy.get('[data-testid="checkout-company"]').clear().type(defaultAddress.company);
  }
  
  cy.get('[data-testid="checkout-address-line1"]').clear().type(defaultAddress.addressLine1);
  
  if (defaultAddress.addressLine2) {
    cy.get('[data-testid="checkout-address-line2"]').clear().type(defaultAddress.addressLine2);
  }
  
  cy.get('[data-testid="checkout-city"]').clear().type(defaultAddress.city);
  cy.get('[data-testid="checkout-state"]').clear().type(defaultAddress.state);
  cy.get('[data-testid="checkout-postal-code"]').clear().type(defaultAddress.postalCode);
  
  cy.get('[data-testid="checkout-country"]').select(defaultAddress.country);
  
  if (defaultAddress.phoneNumber) {
    cy.get('[data-testid="checkout-phone"]').clear().type(defaultAddress.phoneNumber);
  }
});

Cypress.Commands.add('fillBillingAddress', (address = {}) => {
  const defaultAddress = {
    firstName: 'Jane',
    lastName: 'Smith',
    company: '',
    addressLine1: '456 Oak Ave',
    addressLine2: '',
    city: 'Another City',
    state: 'NY',
    postalCode: '54321',
    country: 'US',
    phoneNumber: '555-987-6543',
    ...address
  };

  // Navigate to billing address form (ensure same as shipping is unchecked)
  cy.get('[data-testid="checkout-same-as-shipping"]').uncheck();

  // Fill billing address form - using same data-testids but within billing section
  cy.get('[data-testid="checkout-billing-section"]').within(() => {
    cy.get('[data-testid="checkout-first-name"]').clear().type(defaultAddress.firstName);
    cy.get('[data-testid="checkout-last-name"]').clear().type(defaultAddress.lastName);
    
    if (defaultAddress.company) {
      cy.get('[data-testid="checkout-company"]').clear().type(defaultAddress.company);
    }
    
    cy.get('[data-testid="checkout-address-line1"]').clear().type(defaultAddress.addressLine1);
    
    if (defaultAddress.addressLine2) {
      cy.get('[data-testid="checkout-address-line2"]').clear().type(defaultAddress.addressLine2);
    }
    
    cy.get('[data-testid="checkout-city"]').clear().type(defaultAddress.city);
    cy.get('[data-testid="checkout-state"]').clear().type(defaultAddress.state);
    cy.get('[data-testid="checkout-postal-code"]').clear().type(defaultAddress.postalCode);
    
    cy.get('[data-testid="checkout-country"]').select(defaultAddress.country);
    
    if (defaultAddress.phoneNumber) {
      cy.get('[data-testid="checkout-phone"]').clear().type(defaultAddress.phoneNumber);
    }
  });
});

Cypress.Commands.add('addItemToCart', (productId: string, quantity: number = 1) => {
  // Mock adding item to cart
  cy.intercept('POST', '/api/cart/add', {
    statusCode: 200,
    body: {
      id: Math.random(),
      productId,
      productName: `Test Product ${productId}`,
      quantity,
      price: 25.00,
      total: 25.00 * quantity,
      productImageUrl: '/assets/images/placeholder-product.jpg'
    }
  }).as(`addToCart-${productId}`);

  cy.intercept('GET', '/api/cart', {
    statusCode: 200,
    body: {
      id: 'cart-123',
      items: [
        {
          id: 1,
          productId: 'test-product-1',
          productName: 'Test Product 1',
          productImageUrl: '/assets/images/placeholder-product.jpg',
          variantName: null,
          quantity: 2,
          price: 25.00,
          total: 50.00
        },
        {
          id: 2,
          productId: 'test-product-2',
          productName: 'Test Product 2',
          productImageUrl: '/assets/images/placeholder-product.jpg',
          variantName: null,
          quantity: 1,
          price: 30.00,
          total: 30.00
        }
      ],
      subTotal: 80.00,
      totalAmount: 80.00,
      itemCount: 3
    }
  }).as('getCart');

  // Simulate clicking add to cart button for the product
  cy.get(`[data-testid="add-to-cart-${productId}"]`).click();
  cy.wait(`@addToCart-${productId}`);
});

Cypress.Commands.add('completeCheckout', () => {
  // Mock cart with items
  cy.intercept('GET', '/api/cart', {
    statusCode: 200,
    body: {
      id: 'cart-123',
      items: [
        {
          id: 1,
          productId: 'test-product-1',
          productName: 'Test Product 1',
          productImageUrl: '/assets/images/placeholder-product.jpg',
          variantName: null,
          quantity: 2,
          price: 25.00,
          total: 50.00
        }
      ],
      subTotal: 50.00,
      totalAmount: 50.00,
      itemCount: 2
    }
  }).as('getCart');

  // Mock successful order creation
  cy.intercept('POST', '/api/checkout/create-order', {
    statusCode: 201,
    body: {
      id: 'order-123',
      orderNumber: 'ORD-001',
      status: 'Processing',
      subTotal: 50.00,
      taxAmount: 4.00,
      shippingAmount: 15.00,
      totalAmount: 69.00,
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
  }).as('createOrder');

  // Navigate to checkout and complete the flow
  cy.visit('/checkout');
  
  // Step 1: Fill shipping address
  cy.fillShippingAddress();
  cy.get('[data-testid="checkout-continue-button"]').click();
  
  // Step 2: Review and place order
  cy.get('[data-testid="checkout-place-order-button"]').click();
  cy.wait('@createOrder');
  
  // Should now be on confirmation step
  cy.get('[data-testid="checkout-step-confirmation"]').should('be.visible');
});

// Helper function to set up common test data
Cypress.Commands.add('setupCheckoutTestData', () => {
  // Mock authentication if needed
  cy.intercept('GET', '/api/auth/profile', {
    statusCode: 200,
    body: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }
  });

  // Mock product data
  cy.intercept('GET', '/api/products', {
    statusCode: 200,
    body: {
      items: [
        {
          id: 'test-product-1',
          name: 'Test Product 1',
          price: 25.00,
          imageUrl: '/assets/images/placeholder-product.jpg',
          description: 'A test product for E2E testing'
        },
        {
          id: 'test-product-2',
          name: 'Test Product 2',
          price: 30.00,
          imageUrl: '/assets/images/placeholder-product.jpg',
          description: 'Another test product for E2E testing'
        }
      ]
    }
  });
});

// Export types for TypeScript support
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      fillShippingAddress(address?: Partial<Address>): Chainable<void>;
      fillBillingAddress(address?: Partial<Address>): Chainable<void>;
      addItemToCart(productId: string, quantity?: number): Chainable<void>;
      completeCheckout(): Chainable<void>;
      setupCheckoutTestData(): Chainable<void>;
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