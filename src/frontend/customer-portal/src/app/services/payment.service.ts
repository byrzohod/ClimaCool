import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

export interface CreatePaymentIntentDto {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  metadata?: { [key: string]: string };
}

export interface PaymentIntentResponseDto {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
  requiresAction: boolean;
  nextAction?: string;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  paymentIntentId: string;
  provider: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  cardLast4?: string;
  cardBrand?: string;
  processedAt?: Date;
  failureReason?: string;
}

export interface PaymentMethodDto {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardholderName?: string;
  isDefault: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface CreatePaymentMethodDto {
  stripePaymentMethodId?: string;
  cardNumber?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardCvc?: string;
  cardholderName?: string;
  setAsDefault?: boolean;
}

export interface RefundDto {
  id: string;
  paymentId: string;
  orderId: string;
  refundId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  notes?: string;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface CreateRefundDto {
  paymentId: string;
  amount: number;
  reason: string;
  notes?: string;
}

export interface PaymentSummaryDto {
  totalPayments: number;
  totalRefunds: number;
  netAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/payment`;
  private paymentMethodApiUrl = `${environment.apiUrl}/api/payment-method`;
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  constructor(private http: HttpClient) {
    this.initializeStripe();
  }

  private async initializeStripe(): Promise<void> {
    // You'll need to get the publishable key from your environment config
    const stripePublishableKey = environment.stripePublishableKey;
    if (stripePublishableKey) {
      this.stripe = await loadStripe(stripePublishableKey);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Payment Intent Methods
  createPaymentIntent(dto: CreatePaymentIntentDto): Observable<PaymentIntentResponseDto> {
    return this.http.post<PaymentIntentResponseDto>(
      `${this.apiUrl}/create-intent`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  confirmPayment(dto: ConfirmPaymentDto): Observable<PaymentIntentResponseDto> {
    return this.http.post<PaymentIntentResponseDto>(
      `${this.apiUrl}/confirm`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  getPaymentById(id: string): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getPaymentsByOrderId(orderId: string): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(
      `${this.apiUrl}/order/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Refund Methods
  createRefund(dto: CreateRefundDto): Observable<RefundDto> {
    return this.http.post<RefundDto>(
      `${this.apiUrl}/refund`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  getRefundById(id: string): Observable<RefundDto> {
    return this.http.get<RefundDto>(
      `${this.apiUrl}/refund/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRefundsByOrderId(orderId: string): Observable<RefundDto[]> {
    return this.http.get<RefundDto[]>(
      `${this.apiUrl}/refunds/order/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Payment Summary
  getPaymentSummary(startDate: Date, endDate: Date): Observable<PaymentSummaryDto> {
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    return this.http.get<PaymentSummaryDto>(
      `${this.apiUrl}/summary`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  // Payment Method Methods
  getUserPaymentMethods(): Observable<PaymentMethodDto[]> {
    return this.http.get<PaymentMethodDto[]>(
      this.paymentMethodApiUrl,
      { headers: this.getAuthHeaders() }
    );
  }

  addPaymentMethod(dto: CreatePaymentMethodDto): Observable<PaymentMethodDto> {
    return this.http.post<PaymentMethodDto>(
      this.paymentMethodApiUrl,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  deletePaymentMethod(id: string): Observable<boolean> {
    return this.http.delete<boolean>(
      `${this.paymentMethodApiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  setDefaultPaymentMethod(id: string): Observable<boolean> {
    return this.http.put<boolean>(
      `${this.paymentMethodApiUrl}/${id}/set-default`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Stripe Elements Methods
  async createCardElement(elementId?: string): Promise<StripeCardElement | null> {
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      console.error('Stripe not initialized');
      return null;
    }

    this.elements = this.stripe.elements();
    
    const style = {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    this.cardElement = this.elements.create('card', { style });
    
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        this.cardElement.mount(`#${elementId}`);
      }
    }

    return this.cardElement;
  }

  async confirmCardPayment(clientSecret: string, saveCard: boolean = false): Promise<any> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe or card element not initialized');
    }

    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement
      },
      setup_future_usage: saveCard ? 'off_session' : undefined
    });

    if (result.error) {
      throw result.error;
    }

    return result.paymentIntent;
  }

  async createPaymentMethod(): Promise<any> {
    if (!this.stripe || !this.cardElement) {
      throw new Error('Stripe or card element not initialized');
    }

    const result = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement
    });

    if (result.error) {
      throw result.error;
    }

    return result.paymentMethod;
  }

  destroyCardElement(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
    if (this.elements) {
      this.elements = null;
    }
  }
}