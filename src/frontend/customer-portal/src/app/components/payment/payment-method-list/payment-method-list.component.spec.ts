import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PaymentMethodListComponent } from './payment-method-list.component';
import { PaymentService, PaymentMethodDto } from '../../../services/payment.service';

describe('PaymentMethodListComponent', () => {
  let component: PaymentMethodListComponent;
  let fixture: ComponentFixture<PaymentMethodListComponent>;
  let mockPaymentService: jasmine.SpyObj<PaymentService>;
  
  const mockPaymentMethods: PaymentMethodDto[] = [
    {
      id: '1',
      stripePaymentMethodId: 'pm_test_1',
      type: 'card',
      cardBrand: 'Visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2025,
      cardholderName: 'John Doe',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      lastUsedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      stripePaymentMethodId: 'pm_test_2',
      type: 'card',
      cardBrand: 'Mastercard',
      cardLast4: '5555',
      cardExpMonth: 6,
      cardExpYear: 2026,
      cardholderName: 'Jane Doe',
      isDefault: false,
      createdAt: new Date('2024-01-02')
    }
  ];

  beforeEach(async () => {
    mockPaymentService = jasmine.createSpyObj('PaymentService', [
      'getUserPaymentMethods',
      'setDefaultPaymentMethod',
      'deletePaymentMethod'
    ]);

    await TestBed.configureTestingModule({
      imports: [PaymentMethodListComponent],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentMethodListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loading Payment Methods', () => {
    it('should load payment methods on init', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(of(mockPaymentMethods));
      
      component.ngOnInit();
      
      expect(mockPaymentService.getUserPaymentMethods).toHaveBeenCalled();
      expect(component.paymentMethods).toEqual(mockPaymentMethods);
      expect(component.isLoading).toBeFalsy();
    });

    it('should auto-select default method when selectable', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(of(mockPaymentMethods));
      component.selectable = true;
      spyOn(component.methodSelected, 'emit');
      
      component.ngOnInit();
      
      expect(component.selectedMethodId).toBe('1');
      expect(component.methodSelected.emit).toHaveBeenCalledWith(mockPaymentMethods[0]);
    });

    it('should handle error when loading payment methods', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.ngOnInit();
      
      expect(component.errorMessage).toBe('Failed to load payment methods');
      expect(component.isLoading).toBeFalsy();
    });

    it('should show empty state when no payment methods', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(of([]));
      
      component.ngOnInit();
      
      expect(component.paymentMethods).toEqual([]);
      expect(component.selectedMethodId).toBeNull();
    });
  });

  describe('Selecting Payment Methods', () => {
    beforeEach(() => {
      component.paymentMethods = mockPaymentMethods;
      component.selectable = true;
    });

    it('should emit selected method when selectable', () => {
      spyOn(component.methodSelected, 'emit');
      
      component.selectMethod(mockPaymentMethods[1]);
      
      expect(component.selectedMethodId).toBe('2');
      expect(component.methodSelected.emit).toHaveBeenCalledWith(mockPaymentMethods[1]);
    });

    it('should not select method when not selectable', () => {
      component.selectable = false;
      spyOn(component.methodSelected, 'emit');
      
      component.selectMethod(mockPaymentMethods[1]);
      
      expect(component.selectedMethodId).toBeNull();
      expect(component.methodSelected.emit).not.toHaveBeenCalled();
    });
  });

  describe('Setting Default Payment Method', () => {
    beforeEach(() => {
      component.paymentMethods = [...mockPaymentMethods];
    });

    it('should set payment method as default', () => {
      mockPaymentService.setDefaultPaymentMethod.and.returnValue(of(true));
      
      component.setAsDefault(mockPaymentMethods[1]);
      
      expect(mockPaymentService.setDefaultPaymentMethod).toHaveBeenCalledWith('2');
      expect(component.paymentMethods[0].isDefault).toBeFalsy();
      expect(component.paymentMethods[1].isDefault).toBeTruthy();
    });

    it('should not call service if already default', () => {
      component.setAsDefault(mockPaymentMethods[0]);
      
      expect(mockPaymentService.setDefaultPaymentMethod).not.toHaveBeenCalled();
    });

    it('should handle error when setting default', () => {
      mockPaymentService.setDefaultPaymentMethod.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.setAsDefault(mockPaymentMethods[1]);
      
      expect(component.errorMessage).toBe('Failed to set default payment method');
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe('Removing Payment Methods', () => {
    beforeEach(() => {
      component.paymentMethods = [...mockPaymentMethods];
      spyOn(window, 'confirm');
    });

    it('should remove payment method on confirmation', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockPaymentService.deletePaymentMethod.and.returnValue(of(true));
      spyOn(component.methodRemoved, 'emit');
      
      component.removeMethod(mockPaymentMethods[0]);
      
      expect(mockPaymentService.deletePaymentMethod).toHaveBeenCalledWith('1');
      expect(component.paymentMethods.length).toBe(1);
      expect(component.paymentMethods[0].id).toBe('2');
      expect(component.methodRemoved.emit).toHaveBeenCalledWith('1');
    });

    it('should not remove payment method when cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      
      component.removeMethod(mockPaymentMethods[0]);
      
      expect(mockPaymentService.deletePaymentMethod).not.toHaveBeenCalled();
      expect(component.paymentMethods.length).toBe(2);
    });

    it('should auto-select another method after removing selected', () => {
      component.selectable = true;
      component.selectedMethodId = '1';
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockPaymentService.deletePaymentMethod.and.returnValue(of(true));
      spyOn(component.methodSelected, 'emit');
      
      component.removeMethod(mockPaymentMethods[0]);
      
      expect(component.selectedMethodId).toBe('2');
      expect(component.methodSelected.emit).toHaveBeenCalled();
    });

    it('should handle error when removing payment method', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockPaymentService.deletePaymentMethod.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.removeMethod(mockPaymentMethods[0]);
      
      expect(component.errorMessage).toBe('Failed to remove payment method');
      expect(component.paymentMethods.length).toBe(2);
    });
  });

  describe('UI Events', () => {
    it('should emit add new method event', () => {
      spyOn(component.addNewMethod, 'emit');
      
      component.onAddNewMethod();
      
      expect(component.addNewMethod.emit).toHaveBeenCalled();
    });

    it('should refresh payment methods', () => {
      mockPaymentService.getUserPaymentMethods.and.returnValue(of(mockPaymentMethods));
      
      component.refresh();
      
      expect(mockPaymentService.getUserPaymentMethods).toHaveBeenCalled();
      expect(component.paymentMethods).toEqual(mockPaymentMethods);
    });
  });

  describe('Formatting Methods', () => {
    it('should format card number correctly', () => {
      expect(component.formatCardNumber('4242')).toBe('•••• •••• •••• 4242');
      expect(component.formatCardNumber('5555')).toBe('•••• •••• •••• 5555');
    });

    it('should format expiry date correctly', () => {
      expect(component.formatExpiryDate(1, 2025)).toBe('01/25');
      expect(component.formatExpiryDate(12, 2026)).toBe('12/26');
      expect(component.formatExpiryDate(undefined, undefined)).toBe('');
    });

    it('should get correct card brand icon', () => {
      expect(component.getCardBrandIcon('visa')).toContain('visa');
      expect(component.getCardBrandIcon('mastercard')).toContain('mastercard');
      expect(component.getCardBrandIcon(undefined)).toContain('generic');
    });

    it('should get correct card brand class', () => {
      expect(component.getCardBrandClass('Visa')).toBe('card-brand-visa');
      expect(component.getCardBrandClass('MasterCard')).toBe('card-brand-mastercard');
      expect(component.getCardBrandClass(undefined)).toBe('card-brand-generic');
    });
  });

  describe('Component State', () => {
    it('should initialize with correct default values', () => {
      expect(component.paymentMethods).toEqual([]);
      expect(component.selectedMethodId).toBeNull();
      expect(component.isLoading).toBeFalsy();
      expect(component.errorMessage).toBeNull();
      expect(component.selectable).toBeFalsy();
      expect(component.showAddButton).toBeTruthy();
    });

    it('should clear error message when loading', () => {
      component.errorMessage = 'Previous error';
      mockPaymentService.getUserPaymentMethods.and.returnValue(of([]));
      
      component.loadPaymentMethods();
      
      expect(component.errorMessage).toBeNull();
    });
  });
});