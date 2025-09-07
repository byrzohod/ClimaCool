describe('Order Management E2E Tests', () => {
  const testUser = {
    email: 'test.user@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User'
  };

  const testOrder = {
    orderNumber: 'ORD-2024-001',
    status: 'Processing',
    total: 299.99,
    items: [
      {
        name: 'Premium HVAC Filter',
        quantity: 2,
        price: 49.99
      },
      {
        name: 'Smart Thermostat',
        quantity: 1,
        price: 199.99
      }
    ]
  };

  beforeEach(() => {
    // Reset database and seed test data
    cy.task('db:seed');
    
    // Login as test user
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type(testUser.email);
    cy.get('[data-cy=password-input]').type(testUser.password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/auth/login');
  });

  describe('Customer Order Dashboard', () => {
    beforeEach(() => {
      cy.visit('/orders');
    });

    it('should display order dashboard with statistics', () => {
      cy.get('[data-cy=orders-dashboard]').should('be.visible');
      cy.get('[data-cy=total-orders-stat]').should('be.visible');
      cy.get('[data-cy=processing-orders-stat]').should('be.visible');
      cy.get('[data-cy=delivered-orders-stat]').should('be.visible');
      cy.get('[data-cy=total-spent-stat]').should('be.visible');
    });

    it('should display list of orders', () => {
      cy.get('[data-cy=orders-list]').should('be.visible');
      cy.get('[data-cy=order-card]').should('have.length.at.least', 1);
      
      // Check order card content
      cy.get('[data-cy=order-card]').first().within(() => {
        cy.get('[data-cy=order-number]').should('be.visible');
        cy.get('[data-cy=order-status]').should('be.visible');
        cy.get('[data-cy=order-date]').should('be.visible');
        cy.get('[data-cy=order-total]').should('be.visible');
        cy.get('[data-cy=order-items]').should('be.visible');
      });
    });

    it('should filter orders by status', () => {
      // Select status filter
      cy.get('[data-cy=status-filter]').select('Processing');
      cy.get('[data-cy=apply-filters]').click();
      
      // Verify filtered results
      cy.get('[data-cy=order-card]').each(($card) => {
        cy.wrap($card).find('[data-cy=order-status]').should('contain', 'Processing');
      });
    });

    it('should filter orders by date range', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      cy.get('[data-cy=date-from-filter]').type(startDate);
      cy.get('[data-cy=date-to-filter]').type(endDate);
      cy.get('[data-cy=apply-filters]').click();
      
      // Verify orders are within date range
      cy.get('[data-cy=order-card]').should('have.length.at.least', 1);
    });

    it('should search orders by order number', () => {
      cy.get('[data-cy=search-input]').type(testOrder.orderNumber);
      cy.get('[data-cy=apply-filters]').click();
      
      // Verify search results
      cy.get('[data-cy=order-card]').should('have.length', 1);
      cy.get('[data-cy=order-number]').should('contain', testOrder.orderNumber);
    });

    it('should sort orders by date', () => {
      cy.get('[data-cy=sort-date]').click();
      
      // Verify orders are sorted
      let previousDate: Date | null = null;
      cy.get('[data-cy=order-date]').each(($date) => {
        const currentDate = new Date($date.text());
        if (previousDate) {
          expect(currentDate.getTime()).to.be.at.most(previousDate.getTime());
        }
        previousDate = currentDate;
      });
    });

    it('should paginate through orders', () => {
      // Assuming we have more than one page of orders
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=next-page]').click();
      
      // Verify page changed
      cy.get('[data-cy=current-page]').should('contain', '2');
      cy.get('[data-cy=order-card]').should('have.length.at.least', 1);
    });

    it('should navigate to order details', () => {
      cy.get('[data-cy=view-order-button]').first().click();
      cy.url().should('include', '/orders/');
      cy.get('[data-cy=order-details]').should('be.visible');
    });
  });

  describe('Order Details View', () => {
    beforeEach(() => {
      // Navigate to a specific order
      cy.visit(`/orders/${testOrder.orderNumber}`);
    });

    it('should display complete order information', () => {
      cy.get('[data-cy=order-details]').should('be.visible');
      cy.get('[data-cy=order-header]').should('contain', testOrder.orderNumber);
      cy.get('[data-cy=order-status-badge]').should('contain', testOrder.status);
      cy.get('[data-cy=order-total]').should('contain', testOrder.total);
    });

    it('should display order timeline', () => {
      cy.get('[data-cy=order-timeline]').should('be.visible');
      cy.get('[data-cy=timeline-event]').should('have.length.at.least', 1);
      
      // Check timeline events
      cy.get('[data-cy=timeline-event]').each(($event) => {
        cy.wrap($event).within(() => {
          cy.get('[data-cy=event-status]').should('be.visible');
          cy.get('[data-cy=event-description]').should('be.visible');
          cy.get('[data-cy=event-timestamp]').should('be.visible');
        });
      });
    });

    it('should display order items with details', () => {
      cy.get('[data-cy=order-items-section]').should('be.visible');
      
      testOrder.items.forEach((item, index) => {
        cy.get('[data-cy=order-item]').eq(index).within(() => {
          cy.get('[data-cy=item-name]').should('contain', item.name);
          cy.get('[data-cy=item-quantity]').should('contain', item.quantity);
          cy.get('[data-cy=item-price]').should('contain', item.price);
        });
      });
    });

    it('should display shipping and billing addresses', () => {
      cy.get('[data-cy=shipping-address]').should('be.visible');
      cy.get('[data-cy=billing-address]').should('be.visible');
      
      // Check address details
      cy.get('[data-cy=shipping-address]').within(() => {
        cy.get('[data-cy=address-name]').should('be.visible');
        cy.get('[data-cy=address-line1]').should('be.visible');
        cy.get('[data-cy=address-city]').should('be.visible');
        cy.get('[data-cy=address-state]').should('be.visible');
        cy.get('[data-cy=address-zip]').should('be.visible');
      });
    });

    it('should display tracking information when available', () => {
      // For shipped orders
      cy.get('[data-cy=tracking-section]').should('be.visible');
      cy.get('[data-cy=tracking-number]').should('be.visible');
      cy.get('[data-cy=carrier]').should('be.visible');
      cy.get('[data-cy=track-package-button]').should('be.visible');
    });

    it('should allow order cancellation for eligible orders', () => {
      // Check if cancel button is visible for eligible status
      cy.get('[data-cy=order-status-badge]').then(($status) => {
        const status = $status.text();
        if (['Pending', 'Confirmed', 'Processing'].includes(status)) {
          cy.get('[data-cy=cancel-order-button]').should('be.visible');
        } else {
          cy.get('[data-cy=cancel-order-button]').should('not.exist');
        }
      });
    });

    it('should cancel order with reason', () => {
      // Only run if order can be cancelled
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=cancel-order-button]').length > 0) {
          cy.get('[data-cy=cancel-order-button]').click();
          
          // Fill cancellation modal
          cy.get('[data-cy=cancel-modal]').should('be.visible');
          cy.get('[data-cy=cancellation-reason]').type('Found a better price elsewhere');
          cy.get('[data-cy=confirm-cancel-button]').click();
          
          // Verify order was cancelled
          cy.get('[data-cy=order-status-badge]').should('contain', 'Cancelled');
          cy.get('[data-cy=cancel-order-button]').should('not.exist');
        }
      });
    });

    it('should reorder items from previous order', () => {
      cy.get('[data-cy=reorder-button]').click();
      
      // Should add items to cart and redirect
      cy.url().should('include', '/cart');
      cy.get('[data-cy=cart-items]').should('have.length', testOrder.items.length);
    });

    it('should navigate back to orders list', () => {
      cy.get('[data-cy=back-to-orders]').click();
      cy.url().should('include', '/orders');
      cy.get('[data-cy=orders-dashboard]').should('be.visible');
    });
  });

  describe('Admin Order Management', () => {
    beforeEach(() => {
      // Login as admin
      cy.task('db:seed');
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('admin@climacool.com');
      cy.get('[data-cy=password-input]').type('Admin123!@#');
      cy.get('[data-cy=login-button]').click();
      
      // Navigate to admin orders
      cy.visit('/admin/orders');
    });

    it('should display admin order dashboard', () => {
      cy.get('[data-cy=admin-orders]').should('be.visible');
      cy.get('[data-cy=orders-table]').should('be.visible');
      cy.get('[data-cy=admin-statistics]').should('be.visible');
    });

    it('should display overall statistics', () => {
      cy.get('[data-cy=total-orders-stat]').should('be.visible');
      cy.get('[data-cy=pending-orders-stat]').should('be.visible');
      cy.get('[data-cy=processing-orders-stat]').should('be.visible');
      cy.get('[data-cy=total-revenue-stat]').should('be.visible');
    });

    it('should update order status', () => {
      cy.get('[data-cy=update-status-button]').first().click();
      
      // Fill status update modal
      cy.get('[data-cy=status-update-modal]').should('be.visible');
      cy.get('[data-cy=new-status-select]').select('Shipped');
      cy.get('[data-cy=status-notes]').type('Order shipped via FedEx');
      cy.get('[data-cy=confirm-update-button]').click();
      
      // Verify status updated
      cy.get('[data-cy=order-status]').first().should('contain', 'Shipped');
    });

    it('should view order details in admin mode', () => {
      cy.get('[data-cy=view-order-button]').first().click();
      cy.url().should('include', '/admin/orders/');
      cy.get('[data-cy=admin-order-details]').should('be.visible');
    });

    it('should update shipping information', () => {
      cy.get('[data-cy=view-order-button]').first().click();
      
      // Update shipping info
      cy.get('[data-cy=carrier-input]').clear().type('UPS');
      cy.get('[data-cy=tracking-number-input]').clear().type('1Z999AA10123456784');
      cy.get('[data-cy=update-shipping-button]').click();
      
      // Verify update
      cy.get('[data-cy=success-message]').should('contain', 'Shipping information updated');
    });

    it('should add internal notes', () => {
      cy.get('[data-cy=view-order-button]').first().click();
      
      // Add internal notes
      cy.get('[data-cy=internal-notes]').type('Customer requested expedited shipping');
      cy.get('[data-cy=save-notes-button]').click();
      
      // Verify notes saved
      cy.get('[data-cy=success-message]').should('contain', 'Notes saved');
    });

    it('should export order details', () => {
      cy.get('[data-cy=view-order-button]').first().click();
      
      // Test export functionality
      cy.get('[data-cy=export-pdf-button]').click();
      // Verify download started (would need custom command to verify file download)
    });

    it('should filter orders by multiple criteria', () => {
      // Apply multiple filters
      cy.get('[data-cy=status-filter]').select('Pending');
      cy.get('[data-cy=date-from-filter]').type('2024-01-01');
      cy.get('[data-cy=search-input]').type('John');
      cy.get('[data-cy=apply-filters]').click();
      
      // Verify filtered results
      cy.get('[data-cy=order-row]').each(($row) => {
        cy.wrap($row).find('[data-cy=order-status]').should('contain', 'Pending');
      });
    });
  });

  describe('Order Status Transitions', () => {
    it('should follow valid status transitions', () => {
      cy.visit('/admin/orders');
      cy.get('[data-cy=view-order-button]').first().click();
      
      // Get current status and verify valid transitions
      cy.get('[data-cy=current-status]').then(($status) => {
        const currentStatus = $status.text();
        cy.get('[data-cy=update-status-button]').click();
        cy.get('[data-cy=new-status-select]').children('option').each(($option) => {
          const validTransitions = getValidTransitions(currentStatus);
          expect(validTransitions).to.include($option.text());
        });
      });
    });
  });

  describe('Order Performance', () => {
    it('should load orders list quickly', () => {
      cy.visit('/orders', {
        onBeforeLoad: (win) => {
          win.performance.mark('orders-start');
        },
        onLoad: (win) => {
          win.performance.mark('orders-end');
          win.performance.measure('orders-load', 'orders-start', 'orders-end');
          const measure = win.performance.getEntriesByName('orders-load')[0];
          expect(measure.duration).to.be.lessThan(3000); // Less than 3 seconds
        }
      });
    });

    it('should handle large order lists efficiently', () => {
      // Seed database with many orders
      cy.task('db:seedLargeOrderSet', { count: 100 });
      cy.visit('/orders');
      
      // Verify pagination is working
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=total-pages]').should('contain.text', '5'); // 100 orders / 20 per page
      
      // Navigate through pages
      cy.get('[data-cy=next-page]').click();
      cy.get('[data-cy=current-page]').should('contain', '2');
    });
  });
});

// Helper function to get valid transitions
function getValidTransitions(status: string): string[] {
  const transitions: { [key: string]: string[] } = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Processing', 'Cancelled'],
    'Processing': ['Shipped', 'Cancelled'],
    'Shipped': ['Delivered'],
    'Delivered': ['Refunded'],
    'Cancelled': ['Refunded'],
    'Refunded': []
  };
  return transitions[status] || [];
}