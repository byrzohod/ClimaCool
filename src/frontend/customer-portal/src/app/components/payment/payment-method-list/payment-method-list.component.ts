import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, PaymentMethodDto } from '../../../services/payment.service';

@Component({
  selector: 'app-payment-method-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-method-list.component.html',
  styleUrls: ['./payment-method-list.component.scss']
})
export class PaymentMethodListComponent implements OnInit {
  @Input() selectable: boolean = false;
  @Input() showAddButton: boolean = true;
  @Output() methodSelected = new EventEmitter<PaymentMethodDto>();
  @Output() addNewMethod = new EventEmitter<void>();
  @Output() methodRemoved = new EventEmitter<string>();

  paymentMethods: PaymentMethodDto[] = [];
  selectedMethodId: string | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.paymentService.getUserPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        
        // Auto-select default method if in selectable mode
        if (this.selectable && methods.length > 0) {
          const defaultMethod = methods.find(m => m.isDefault) || methods[0];
          this.selectMethod(defaultMethod);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load payment methods';
        this.isLoading = false;
        console.error('Error loading payment methods:', error);
      }
    });
  }

  selectMethod(method: PaymentMethodDto): void {
    if (this.selectable) {
      this.selectedMethodId = method.id;
      this.methodSelected.emit(method);
    }
  }

  setAsDefault(method: PaymentMethodDto): void {
    if (method.isDefault) return;

    this.isLoading = true;
    this.paymentService.setDefaultPaymentMethod(method.id).subscribe({
      next: () => {
        // Update local state
        this.paymentMethods.forEach(m => {
          m.isDefault = m.id === method.id;
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to set default payment method';
        this.isLoading = false;
        console.error('Error setting default payment method:', error);
      }
    });
  }

  removeMethod(method: PaymentMethodDto): void {
    if (confirm(`Are you sure you want to remove the card ending in ${method.cardLast4}?`)) {
      this.isLoading = true;
      
      this.paymentService.deletePaymentMethod(method.id).subscribe({
        next: () => {
          this.paymentMethods = this.paymentMethods.filter(m => m.id !== method.id);
          
          // If removed method was selected, clear selection
          if (this.selectedMethodId === method.id) {
            this.selectedMethodId = null;
            
            // Auto-select another method if available
            if (this.selectable && this.paymentMethods.length > 0) {
              const newDefault = this.paymentMethods.find(m => m.isDefault) || this.paymentMethods[0];
              this.selectMethod(newDefault);
            }
          }
          
          this.methodRemoved.emit(method.id);
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to remove payment method';
          this.isLoading = false;
          console.error('Error removing payment method:', error);
        }
      });
    }
  }

  onAddNewMethod(): void {
    this.addNewMethod.emit();
  }

  formatCardNumber(last4: string): string {
    return `•••• •••• •••• ${last4}`;
  }

  formatExpiryDate(month?: number, year?: number): string {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  }

  getCardBrandIcon(brand?: string): string {
    const brandIcons: { [key: string]: string } = {
      'visa': 'assets/icons/visa.svg',
      'mastercard': 'assets/icons/mastercard.svg',
      'amex': 'assets/icons/amex.svg',
      'discover': 'assets/icons/discover.svg'
    };
    
    return brandIcons[brand?.toLowerCase() || ''] || 'assets/icons/card-generic.svg';
  }

  getCardBrandClass(brand?: string): string {
    return `card-brand-${brand?.toLowerCase() || 'generic'}`;
  }

  refresh(): void {
    this.loadPaymentMethods();
  }
}