describe('Payment Flow E2E Tests', () => {
  beforeEach(() => {
    // Setup: Login and navigate to checkout
    cy.visit('/');
    cy.login('testuser@example.com', 'Test123!@#');
    
    // Add a product to cart
    cy.visit('/products');
    cy.get('[data-cy=product-card]').first().click();
    cy.get('[data-cy=add-to-cart-button]').click();
    
    // Navigate to checkout
    cy.visit('/cart');
    cy.get('[data-cy=checkout-button]').click();
  });

  describe('Payment Form', () => {
    it('should display payment form with order total', () => {
      cy.get('.payment-form-container').should('be.visible');
      cy.get('.order-total').should('contain', '$');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('.error-message').should('contain', 'Please fill in all required fields');
      cy.get('#cardholderName').should('have.class', 'is-invalid');
      cy.get('#email').should('have.class', 'is-invalid');
    });

    it('should accept valid card information', () => {
      // Fill in payment form
      cy.get('#cardholderName').type('Test User');
      cy.get('#email').type('test@example.com');
      
      // Stripe test card - this requires Stripe Elements to be properly mocked
      cy.fillStripeElement('4242 4242 4242 4242', '12/25', '123');
      
      // Fill billing address
      cy.get('#line1').type('123 Test St');
      cy.get('#city').type('Test City');
      cy.get('#state').type('CA');
      cy.get('#postalCode').type('12345');
      
      cy.get('[data-cy=pay-button]').should('not.be.disabled');
    });

    it('should handle declined card', () => {
      cy.get('#cardholderName').type('Test User');
      cy.get('#email').type('test@example.com');
      
      // Stripe test card that will be declined
      cy.fillStripeElement('4000 0000 0000 0002', '12/25', '123');
      
      cy.fillBillingAddress();
      
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('.error-message', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'declined');
    });

    it('should save card for future use when checkbox is selected', () => {
      cy.fillPaymentForm();
      cy.get('#saveCard').check();
      
      cy.get('[data-cy=pay-button]').click();
      
      // After successful payment, card should be saved
      cy.visit('/account/payment-methods');
      cy.get('[data-cy=saved-card]').should('contain', '4242');
    });
  });

  describe('Saved Payment Methods', () => {
    beforeEach(() => {
      // Setup: Add a saved payment method
      cy.addSavedPaymentMethod();
    });

    it('should display saved payment methods', () => {
      cy.get('[data-cy=saved-payment-methods]').should('be.visible');
      cy.get('[data-cy=payment-method-option]').should('have.length.at.least', 1);
      cy.get('[data-cy=payment-method-option]').first().should('contain', '•••• 4242');
    });

    it('should allow selection of saved payment method', () => {
      cy.get('[data-cy=payment-method-option]').first().click();
      cy.get('[data-cy=pay-button]').should('not.be.disabled');
    });

    it('should process payment with saved card', () => {
      cy.get('[data-cy=payment-method-option]').first().click();
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('[data-cy=payment-success]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Payment successful');
    });

    it('should allow removal of saved payment method', () => {
      cy.get('[data-cy=remove-payment-method]').first().click();
      cy.get('[data-cy=confirm-remove]').click();
      
      cy.get('[data-cy=payment-method-option]').should('have.length', 0);
    });

    it('should allow adding new card when saved cards exist', () => {
      cy.get('[data-cy=use-new-card]').click();
      cy.get('#card-element').should('be.visible');
      
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('3D Secure Authentication', () => {
    it('should handle 3D Secure authentication flow', () => {
      cy.get('#cardholderName').type('Test User');
      cy.get('#email').type('test@example.com');
      
      // Stripe test card that requires 3D Secure
      cy.fillStripeElement('4000 0025 0000 3155', '12/25', '123');
      
      cy.fillBillingAddress();
      cy.get('[data-cy=pay-button]').click();
      
      // Handle 3D Secure modal (this would need proper Stripe mock)
      cy.get('iframe[name*="stripe"]', { timeout: 10000 }).should('be.visible');
      cy.complete3DSecure();
      
      cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Payment Confirmation', () => {
    it('should show order confirmation after successful payment', () => {
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.url({ timeout: 10000 }).should('include', '/order-confirmation');
      cy.get('[data-cy=order-number]').should('be.visible');
      cy.get('[data-cy=order-total]').should('contain', '$');
      cy.get('[data-cy=payment-status]').should('contain', 'Paid');
    });

    it('should send confirmation email after successful payment', () => {
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      // Check that email was sent (would need email testing service)
      cy.wait(2000);
      cy.checkEmail('test@example.com').should('contain', 'Order Confirmation');
    });

    it('should update order status after payment', () => {
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.visit('/account/orders');
      cy.get('[data-cy=order-row]').first().should('contain', 'Paid');
    });
  });

  describe('Refund Flow', () => {
    beforeEach(() => {
      // Complete a payment first
      cy.completePayment();
    });

    it('should allow refund request from order details', () => {
      cy.visit('/account/orders');
      cy.get('[data-cy=order-row]').first().click();
      cy.get('[data-cy=request-refund]').click();
      
      cy.get('[data-cy=refund-reason]').select('Product Defective');
      cy.get('[data-cy=refund-notes]').type('Product arrived damaged');
      cy.get('[data-cy=submit-refund]').click();
      
      cy.get('[data-cy=refund-status]').should('contain', 'Refund Requested');
    });

    it('should show refund in payment history', () => {
      cy.requestRefund();
      
      cy.visit('/account/payment-history');
      cy.get('[data-cy=payment-row]').should('contain', 'Refunded');
    });
  });

  describe('Payment Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/api/payment/create-intent', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      });
      
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('.error-message')
        .should('be.visible')
        .and('contain', 'Payment failed. Please try again.');
    });

    it('should handle timeout errors', () => {
      cy.intercept('POST', '**/api/payment/create-intent', {
        delay: 30000
      });
      
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('.error-message', { timeout: 15000 })
        .should('be.visible')
        .and('contain', 'Request timed out');
    });

    it('should prevent duplicate payments', () => {
      cy.fillPaymentForm();
      
      // Double click the pay button
      cy.get('[data-cy=pay-button]').dblclick();
      
      // Should only process once
      cy.get('[data-cy=payment-success]').should('have.length', 1);
    });
  });

  describe('Payment Analytics', () => {
    it('should track payment initiation', () => {
      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
      });
      
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.get('@consoleLog').should('be.calledWith', 'Payment initiated');
    });

    it('should track payment success', () => {
      cy.fillPaymentForm();
      cy.get('[data-cy=pay-button]').click();
      
      cy.window().its('dataLayer').should('include', {
        event: 'payment_success',
        value: Cypress.sinon.match.number
      });
    });

    it('should track payment failures', () => {
      cy.get('#cardholderName').type('Test User');
      cy.get('#email').type('test@example.com');
      
      // Declined card
      cy.fillStripeElement('4000 0000 0000 0002', '12/25', '123');
      cy.fillBillingAddress();
      cy.get('[data-cy=pay-button]').click();
      
      cy.window().its('dataLayer').should('include', {
        event: 'payment_failed',
        error_type: 'card_declined'
      });
    });
  });
});

// Helper commands
Cypress.Commands.add('fillStripeElement', (cardNumber: string, expiry: string, cvc: string) => {
  // This would need to interact with Stripe Elements iframe
  // For testing, you might need to mock Stripe or use Stripe's test mode
  cy.get('#card-element').within(() => {
    cy.get('input[name="cardnumber"]').type(cardNumber);
    cy.get('input[name="exp-date"]').type(expiry);
    cy.get('input[name="cvc"]').type(cvc);
  });
});

Cypress.Commands.add('fillBillingAddress', () => {
  cy.get('#line1').type('123 Test St');
  cy.get('#city').type('Test City');
  cy.get('#state').type('CA');
  cy.get('#postalCode').type('12345');
});

Cypress.Commands.add('fillPaymentForm', () => {
  cy.get('#cardholderName').type('Test User');
  cy.get('#email').type('test@example.com');
  cy.fillStripeElement('4242 4242 4242 4242', '12/25', '123');
  cy.fillBillingAddress();
});

Cypress.Commands.add('completePayment', () => {
  cy.fillPaymentForm();
  cy.get('[data-cy=pay-button]').click();
  cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('addSavedPaymentMethod', () => {
  cy.visit('/account/payment-methods');
  cy.get('[data-cy=add-payment-method]').click();
  cy.fillStripeElement('4242 4242 4242 4242', '12/25', '123');
  cy.get('[data-cy=save-payment-method]').click();
});

Cypress.Commands.add('requestRefund', () => {
  cy.visit('/account/orders');
  cy.get('[data-cy=order-row]').first().click();
  cy.get('[data-cy=request-refund]').click();
  cy.get('[data-cy=refund-reason]').select('Product Defective');
  cy.get('[data-cy=submit-refund]').click();
});

Cypress.Commands.add('complete3DSecure', () => {
  // Handle 3D Secure authentication
  // This would need to interact with Stripe's 3D Secure modal
  cy.get('iframe[name*="stripe"]').then($iframe => {
    const $body = $iframe.contents().find('body');
    cy.wrap($body).find('[data-testid=complete-authentication]').click();
  });
});

Cypress.Commands.add('checkEmail', (email: string) => {
  // This would integrate with an email testing service
  // For example, using Mailosaur or similar
  return cy.request(`/api/test-emails/${email}`).its('body');
});