import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex items-center py-4 border-b border-gray-200 last:border-b-0" data-testid="cart-item">
      <!-- Product Image -->
      <div class="flex-shrink-0 mr-4">
        <img 
          [src]="item.productImageUrl || '/assets/images/placeholder-product.jpg'" 
          [alt]="item.productName"
          class="w-16 h-16 object-cover rounded-md bg-gray-100"
          loading="lazy">
      </div>

      <!-- Product Details -->
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-gray-900 truncate">
          <a 
            [routerLink]="['/products', item.productSlug]" 
            class="hover:text-blue-600 transition-colors"
            (click)="onProductClick()">
            {{ item.productName }}
          </a>
        </h4>
        
        <div *ngIf="item.variantName" class="text-xs text-gray-500 mt-1">
          {{ item.variantName }}
        </div>
        
        <div class="flex items-center mt-2 space-x-4">
          <!-- Price -->
          <span class="text-sm font-semibold text-gray-900">
            {{ item.price | currency }}
          </span>
          
          <!-- Stock Status -->
          <span 
            [class]="item.availableStock > 0 ? 'text-green-600' : 'text-red-600'"
            class="text-xs">
            {{ item.availableStock > 0 ? 'In Stock' : 'Out of Stock' }}
          </span>
        </div>
      </div>

      <!-- Quantity Controls -->
      <div class="flex items-center space-x-2 mx-4">
        <button
          (click)="onQuantityChange(item.quantity - 1)"
          [disabled]="item.quantity <= 1 || updating"
          class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="decrease-quantity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
          </svg>
        </button>
        
        <span 
          class="w-8 text-center text-sm font-medium text-gray-900"
          [class.opacity-50]="updating"
          data-testid="item-quantity">
          {{ item.quantity }}
        </span>
        
        <button
          (click)="onQuantityChange(item.quantity + 1)"
          [disabled]="item.quantity >= item.availableStock || updating"
          class="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="increase-quantity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>

      <!-- Item Total -->
      <div class="text-right mr-4">
        <div class="text-sm font-semibold text-gray-900" data-testid="item-total">
          {{ item.total | currency }}
        </div>
      </div>

      <!-- Remove Button -->
      <button
        (click)="onRemove()"
        [disabled]="updating"
        class="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50"
        title="Remove item"
        data-testid="remove-item">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>

      <!-- Loading Overlay -->
      <div 
        *ngIf="updating" 
        class="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
    }
  `]
})
export class CartItemComponent {
  @Input() item!: CartItem;
  @Input() updating = false;
  
  @Output() quantityChange = new EventEmitter<{ productId: number; quantity: number }>();
  @Output() remove = new EventEmitter<number>();
  @Output() productClick = new EventEmitter<void>();

  onQuantityChange(newQuantity: number): void {
    if (newQuantity > 0 && newQuantity <= this.item.availableStock && newQuantity !== this.item.quantity) {
      this.quantityChange.emit({ productId: this.item.productId, quantity: newQuantity });
    }
  }

  onRemove(): void {
    this.remove.emit(this.item.productId);
  }

  onProductClick(): void {
    this.productClick.emit();
  }
}