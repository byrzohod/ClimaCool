import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface PaymentConfirmationData {
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_action' | 'failed';
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
  };
  customerEmail: string;
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  receiptUrl?: string;
  estimatedDelivery?: string;
}

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent {
  @Input() confirmationData!: PaymentConfirmationData;
  @Input() showReturnToShop: boolean = true;
  @Input() showOrderDetails: boolean = true;

  constructor(private router: Router) {}

  get isSuccessful(): boolean {
    return this.confirmationData?.status === 'succeeded';
  }

  get isProcessing(): boolean {
    return this.confirmationData?.status === 'processing';
  }

  get requiresAction(): boolean {
    return this.confirmationData?.status === 'requires_action';
  }

  get isFailed(): boolean {
    return this.confirmationData?.status === 'failed';
  }

  get statusIcon(): string {
    switch (this.confirmationData?.status) {
      case 'succeeded':
        return '✅';
      case 'processing':
        return '⏳';
      case 'requires_action':
        return '❗';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  }

  get statusTitle(): string {
    switch (this.confirmationData?.status) {
      case 'succeeded':
        return 'Payment Successful!';
      case 'processing':
        return 'Payment Processing';
      case 'requires_action':
        return 'Additional Action Required';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment Status Unknown';
    }
  }

  get statusMessage(): string {
    switch (this.confirmationData?.status) {
      case 'succeeded':
        return 'Your payment has been processed successfully. You will receive a confirmation email shortly.';
      case 'processing':
        return 'Your payment is being processed. This may take a few minutes to complete.';
      case 'requires_action':
        return 'Your payment requires additional verification. Please check your email or contact your bank.';
      case 'failed':
        return 'There was an issue processing your payment. Please try again or use a different payment method.';
      default:
        return 'We encountered an issue determining your payment status. Please contact support.';
    }
  }

  get statusClass(): string {
    switch (this.confirmationData?.status) {
      case 'succeeded':
        return 'status-success';
      case 'processing':
        return 'status-processing';
      case 'requires_action':
        return 'status-warning';
      case 'failed':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPaymentMethod(): string {
    const pm = this.confirmationData?.paymentMethod;
    if (!pm) return 'Unknown payment method';

    if (pm.type === 'card' && pm.brand && pm.last4) {
      return `${pm.brand.toUpperCase()} ••••${pm.last4}`;
    }

    return pm.type.charAt(0).toUpperCase() + pm.type.slice(1);
  }

  formatAddress(): string {
    const addr = this.confirmationData?.billingAddress;
    if (!addr) return '';

    let formatted = addr.line1;
    if (addr.line2) formatted += `, ${addr.line2}`;
    formatted += `, ${addr.city}, ${addr.state} ${addr.postal_code}`;
    if (addr.country !== 'US') formatted += `, ${addr.country}`;
    
    return formatted;
  }

  navigateToOrders(): void {
    this.router.navigate(['/account/orders']);
  }

  navigateToShop(): void {
    this.router.navigate(['/products']);
  }

  navigateToOrderDetails(): void {
    if (this.confirmationData?.orderId) {
      this.router.navigate(['/account/orders', this.confirmationData.orderId]);
    }
  }

  downloadReceipt(): void {
    if (this.confirmationData?.receiptUrl) {
      window.open(this.confirmationData.receiptUrl, '_blank');
    }
  }

  printConfirmation(): void {
    window.print();
  }

  shareConfirmation(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Payment Confirmation',
        text: `Payment confirmed for order ${this.confirmationData?.orderNumber}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  }

  contactSupport(): void {
    this.router.navigate(['/support'], {
      queryParams: {
        subject: 'Payment Issue',
        order: this.confirmationData?.orderNumber,
        payment: this.confirmationData?.paymentIntentId
      }
    });
  }

  retryPayment(): void {
    if (this.confirmationData?.orderId) {
      this.router.navigate(['/checkout'], {
        queryParams: { retry: this.confirmationData.orderId }
      });
    }
  }
}