import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../cart/models/cart.model';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <!-- Cart Items -->
      <div class="space-y-4 mb-6">
        <div *ngFor="let item of cartItems" 
             class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
             data-testid="checkout-order-item">
          <!-- Product Image -->
          <div class="flex-shrink-0">
            <img 
              [src]="item.productImageUrl || '/assets/images/placeholder-product.jpg'"
              [alt]="item.productName"
              class="w-16 h-16 object-cover rounded-md">
          </div>
          
          <!-- Product Details -->
          <div class="flex-grow min-w-0">
            <h4 class="text-sm font-medium text-gray-900 truncate">
              {{ item.productName }}
            </h4>
            <p *ngIf="item.variantName" class="text-sm text-gray-600">
              {{ item.variantName }}
            </p>
            <p class="text-sm text-gray-600">
              Qty: {{ item.quantity }}
            </p>
          </div>
          
          <!-- Price -->
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">
              {{ item.total | currency }}
            </div>
            <div class="text-xs text-gray-600">
              {{ item.price | currency }} each
            </div>
          </div>
        </div>
      </div>

      <!-- Order Totals -->
      <div class="border-t border-gray-200 pt-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Subtotal</span>
          <span class="text-gray-900 font-medium" data-testid="checkout-subtotal">
            {{ subtotal | currency }}
          </span>
        </div>
        
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Tax</span>
          <span class="text-gray-900 font-medium" data-testid="checkout-tax">
            {{ taxAmount | currency }}
          </span>
        </div>
        
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Shipping</span>
          <span class="text-gray-900 font-medium" data-testid="checkout-shipping">
            {{ shippingAmount | currency }}
          </span>
        </div>
        
        <div class="border-t border-gray-200 pt-2 mt-4">
          <div class="flex justify-between text-lg font-semibold">
            <span class="text-gray-900">Total</span>
            <span class="text-blue-600" data-testid="checkout-total">
              {{ totalAmount | currency }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderSummaryComponent {
  @Input() cartItems: CartItem[] = [];
  @Input() subtotal: number = 0;
  @Input() taxAmount: number = 0;
  @Input() shippingAmount: number = 0;
  @Input() totalAmount: number = 0;
}