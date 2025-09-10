import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment.service';

interface SavedPaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  isDefault: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-payment-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  @Input() orderId!: string;
  @Input() amount!: number;
  @Input() currency: string = 'USD';

  @Output() paymentComplete = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<string>();

  paymentForm!: FormGroup;
  savedPaymentMethods: SavedPaymentMethod[] = [];
  useNewCard = true;
  selectedPaymentMethodId: string | null = null;
  clientSecret: string | null = null;
  errorMessage: string = '';
  isProcessing = false;
  cardElement: any = null;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSavedPaymentMethods();
    this.createPaymentIntent();
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.paymentService.destroyCardElement();
    }
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      cardholderName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      saveCard: [false],
      billingAddress: this.fb.group({
        line1: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['US']
      })
    });
  }

  private loadSavedPaymentMethods(): void {
    this.paymentService.getUserPaymentMethods().subscribe({
      next: (methods) => {
        this.savedPaymentMethods = methods;
        if (methods.length > 0) {
          this.useNewCard = false;
          this.selectedPaymentMethodId = methods.find(m => m.isDefault)?.stripePaymentMethodId || methods[0].stripePaymentMethodId;
        }
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
      }
    });
  }

  private createPaymentIntent(): void {
    this.paymentService.createPaymentIntent({
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency
    }).subscribe({
      next: (response) => {
        this.clientSecret = response.clientSecret;
      },
      error: (error) => {
        console.error('Error creating payment intent:', error);
        this.errorMessage = 'Failed to initialize payment';
        this.paymentError.emit(this.errorMessage);
      }
    });
  }

  async submitPayment(): Promise<void> {
    if (!this.clientSecret) {
      this.errorMessage = 'Payment not initialized. Please refresh the page.';
      return;
    }

    if (this.useNewCard && !this.paymentForm.valid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    try {
      if (this.useNewCard) {
        await this.processNewCardPayment();
      } else {
        await this.processSavedCardPayment();
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Payment failed';
      this.paymentError.emit(this.errorMessage);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processNewCardPayment(): Promise<void> {
    const saveCard = this.paymentForm.get('saveCard')?.value || false;
    const result = await this.paymentService.confirmCardPayment(this.clientSecret!, saveCard);
    
    if (result.status === 'succeeded') {
      this.paymentComplete.emit(result);
    } else {
      throw new Error('Payment was not completed successfully');
    }
  }

  private processSavedCardPayment(): void {
    this.paymentService.confirmPayment({
      paymentIntentId: this.clientSecret!.split('_secret_')[0],
      paymentMethodId: this.selectedPaymentMethodId!,
      savePaymentMethod: false
    }).subscribe({
      next: (result) => {
        if (result.status === 'succeeded') {
          this.paymentComplete.emit(result);
        } else {
          throw new Error('Payment was not completed successfully');
        }
      },
      error: (error) => {
        throw error;
      }
    });
  }

  onPaymentMethodChange(event: any): void {
    const value = event.target.value;
    
    if (value === 'new') {
      this.useNewCard = true;
      this.selectedPaymentMethodId = null;
      this.createCardElement();
    } else {
      this.useNewCard = false;
      this.selectedPaymentMethodId = value;
      this.paymentService.destroyCardElement();
    }
  }

  private async createCardElement(): Promise<void> {
    try {
      this.cardElement = await this.paymentService.createCardElement('card-element');
    } catch (error) {
      console.error('Error creating card element:', error);
    }
  }

  async addNewPaymentMethod(): Promise<void> {
    if (!this.cardElement) {
      return;
    }

    try {
      const paymentMethod = await this.paymentService.createPaymentMethod();
      const cardholderName = this.paymentForm.get('cardholderName')?.value;

      const savedPaymentMethod = await this.paymentService.addPaymentMethod({
        stripePaymentMethodId: paymentMethod.id,
        cardholderName: cardholderName,
        setAsDefault: true
      }).toPromise();

      if (savedPaymentMethod) {
        this.savedPaymentMethods.push(savedPaymentMethod);
      }

      this.paymentService.destroyCardElement();
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  }

  removePaymentMethod(paymentMethodId: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.paymentService.deletePaymentMethod(paymentMethodId).subscribe({
        next: () => {
          this.savedPaymentMethods = this.savedPaymentMethods.filter(pm => pm.id !== paymentMethodId);
        },
        error: (error) => {
          console.error('Error removing payment method:', error);
        }
      });
    }
  }

  formatCardNumber(last4: string): string {
    return `•••• •••• •••• ${last4}`;
  }

  getCardIcon(brand: string): string {
    // In a real implementation, you would return appropriate icons
    // For now, returning a generic card icon
    return '💳';
  }
}
