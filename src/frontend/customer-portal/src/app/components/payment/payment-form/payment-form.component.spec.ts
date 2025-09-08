import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PaymentFormComponent } from './payment-form.component';
import { PaymentService } from '../../../services/payment.service';

describe('PaymentFormComponent', () => {
  let component: PaymentFormComponent;
  let fixture: ComponentFixture<PaymentFormComponent>;
  let mockPaymentService: jasmine.SpyObj<PaymentService>;

  beforeEach(async () => {
    mockPaymentService = jasmine.createSpyObj('PaymentService', [
      'getUserPaymentMethods',
      'createPaymentIntent',
      'confirmPayment',
      'createCardElement',
      'confirmCardPayment',
      'createPaymentMethod',
      'addPaymentMethod',
      'deletePaymentMethod',
      'destroyCardElement'
    ]);

    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent, ReactiveFormsModule],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.orderId = 'test-order-123';
    component.amount = 100.00;
    component.currency = 'USD';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize payment form with required fields', () => {
      expect(component.paymentForm.get('cardholderName')).toBeDefined();
      expect(component.paymentForm.get('email')).toBeDefined();
      expect(component.paymentForm.get('saveCard')).toBeDefined();
      expect(component.paymentForm.get('billingAddress')).toBeDefined();
    });

    it('should load saved payment methods on init', () => {
      const mockMethods = [
        {
          id: '1',
          stripePaymentMethodId: 'pm_test_1',
          type: 'card',
          cardBrand: 'Visa',
          cardLast4: '4242',
          isDefault: true,
          createdAt: new Date()
        }
      ];
      
      mockPaymentService.getUserPaymentMethods.and.returnValue(of(mockMethods));
      mockPaymentService.createPaymentIntent.and.returnValue(of({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_456',
        status: 'requires_payment_method',
        amount: 100,
        currency: 'USD',
        requiresAction: false
      }));

      component.ngOnInit();

      expect(mockPaymentService.getUserPaymentMethods).toHaveBeenCalled();
    });

    it('should create payment intent on initialization', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(of([]));
      mockPaymentService.createPaymentIntent.and.returnValue(of({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_456',
        status: 'requires_payment_method',
        amount: 100,
        currency: 'USD',
        requiresAction: false
      }));

      component.ngOnInit();

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        orderId: 'test-order-123',
        amount: 100.00,
        currency: 'USD'
      });
    });
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when required fields are empty', () => {
      component.paymentForm.patchValue({
        cardholderName: '',
        email: ''
      });

      expect(component.paymentForm.valid).toBeFalsy();
    });

    it('should mark form as valid when all required fields are filled', () => {
      component.paymentForm.patchValue({
        cardholderName: 'John Doe',
        email: 'john@example.com',
        billingAddress: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        }
      });

      expect(component.paymentForm.valid).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.paymentForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      component.clientSecret = 'pi_test_123_secret_456';
      mockPaymentService.getUserPaymentMethods.and.returnValue(of([]));
      mockPaymentService.createPaymentIntent.and.returnValue(of({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_456',
        status: 'requires_payment_method',
        amount: 100,
        currency: 'USD',
        requiresAction: false
      }));
    });

    it('should process payment with new card', async () => {
      component.useNewCard = true;
      component.paymentForm.patchValue({
        cardholderName: 'John Doe',
        email: 'john@example.com',
        saveCard: false,
        billingAddress: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        }
      });

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded'
      };

      mockPaymentService.confirmCardPayment.and.returnValue(Promise.resolve(mockPaymentIntent));
      spyOn(component.paymentComplete, 'emit');

      await component.submitPayment();

      expect(mockPaymentService.confirmCardPayment).toHaveBeenCalledWith('pi_test_123_secret_456', false);
      expect(component.paymentComplete.emit).toHaveBeenCalledWith(mockPaymentIntent);
    });

    it('should process payment with saved card', () => {
      component.useNewCard = false;
      component.selectedPaymentMethodId = 'pm_test_123';
      
      mockPaymentService.confirmPayment.and.returnValue(of({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_456',
        status: 'succeeded',
        amount: 100,
        currency: 'USD',
        requiresAction: false
      }));
      
      spyOn(component.paymentComplete, 'emit');

      component.submitPayment();

      expect(mockPaymentService.confirmPayment).toHaveBeenCalledWith({
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_123',
        savePaymentMethod: false
      });
    });

    it('should handle payment errors', async () => {
      component.useNewCard = true;
      component.paymentForm.patchValue({
        cardholderName: 'John Doe',
        email: 'john@example.com',
        billingAddress: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        }
      });

      const error = new Error('Card declined');
      mockPaymentService.confirmCardPayment.and.returnValue(Promise.reject(error));
      spyOn(component.paymentError, 'emit');

      await component.submitPayment();

      expect(component.errorMessage).toBe('Card declined');
      expect(component.paymentError.emit).toHaveBeenCalledWith('Card declined');
    });

    it('should show error when payment is not initialized', async () => {
      component.clientSecret = null;
      
      await component.submitPayment();
      
      expect(component.errorMessage).toBe('Payment not initialized. Please refresh the page.');
    });

    it('should validate form before processing payment', async () => {
      component.useNewCard = true;
      component.paymentForm.patchValue({
        cardholderName: '',
        email: ''
      });

      await component.submitPayment();

      expect(component.errorMessage).toBe('Please fill in all required fields.');
    });
  });

  describe('Payment Method Management', () => {
    it('should switch between saved card and new card', () => {
      const event = { target: { value: 'new' } };
      mockPaymentService.createCardElement.and.returnValue(Promise.resolve(null));
      
      component.onPaymentMethodChange(event);
      
      expect(component.useNewCard).toBeTruthy();
      expect(component.selectedPaymentMethodId).toBeNull();
    });

    it('should select saved payment method', () => {
      const event = { target: { value: 'pm_test_123' } };
      mockPaymentService.destroyCardElement.and.stub();
      
      component.onPaymentMethodChange(event);
      
      expect(component.useNewCard).toBeFalsy();
      expect(component.selectedPaymentMethodId).toBe('pm_test_123');
    });

    it('should add new payment method', async () => {
      const mockPaymentMethod = { id: 'pm_test_new' };
      mockPaymentService.createPaymentMethod.and.returnValue(Promise.resolve(mockPaymentMethod));
      mockPaymentService.addPaymentMethod.and.returnValue(of({
        id: 'saved_pm_123',
        stripePaymentMethodId: 'pm_test_new',
        type: 'card',
        cardBrand: 'Visa',
        cardLast4: '4242',
        isDefault: true,
        createdAt: new Date()
      }));
      mockPaymentService.destroyCardElement.and.stub();

      component.cardElement = {} as any;
      component.paymentForm.patchValue({
        cardholderName: 'John Doe'
      });

      await component.addNewPaymentMethod();

      expect(mockPaymentService.createPaymentMethod).toHaveBeenCalled();
      expect(mockPaymentService.addPaymentMethod).toHaveBeenCalledWith({
        stripePaymentMethodId: 'pm_test_new',
        cardholderName: 'John Doe',
        setAsDefault: true
      });
    });

    it('should remove payment method', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockPaymentService.deletePaymentMethod.and.returnValue(of(true));
      
      component.savedPaymentMethods = [
        {
          id: '1',
          stripePaymentMethodId: 'pm_test_1',
          type: 'card',
          cardLast4: '4242',
          isDefault: true,
          createdAt: new Date()
        }
      ];

      component.removePaymentMethod('1');

      expect(mockPaymentService.deletePaymentMethod).toHaveBeenCalledWith('1');
      expect(component.savedPaymentMethods.length).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should format card number correctly', () => {
      expect(component.formatCardNumber('4242')).toBe('•••• •••• •••• 4242');
    });

    it('should get correct card icon', () => {
      expect(component.getCardIcon('visa')).toBe('💳');
      expect(component.getCardIcon('mastercard')).toBe('💳');
      expect(component.getCardIcon('unknown')).toBe('💳');
    });
  });

  describe('Cleanup', () => {
    it('should destroy card element on component destroy', () => {
      mockPaymentService.destroyCardElement.and.stub();
      component.cardElement = {} as any;
      
      component.ngOnDestroy();
      
      expect(mockPaymentService.destroyCardElement).toHaveBeenCalled();
    });
  });
});