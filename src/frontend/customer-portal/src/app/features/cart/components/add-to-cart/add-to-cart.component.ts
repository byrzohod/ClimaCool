import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AddToCart } from '../../models/cart.model';
import { Product } from '../../../../core/models/product.model';
import * as CartActions from '../../store/cart.actions';
import * as CartSelectors from '../../store/cart.selectors';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center space-x-2">
      <!-- Quantity Selector (if enabled) -->
      <div *ngIf="showQuantitySelector" class="flex items-center border border-gray-300 rounded-md">
        <button
          (click)="decreaseQuantity()"
          [disabled]="quantity <= 1 || (loading$ | async)"
          class="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
          </svg>
        </button>
        
        <input
          type="number"
          [value]="quantity"
          (input)="onQuantityInput($event)"
          [min]="1"
          [max]="product?.stockQuantity || 999"
          class="w-12 py-1 text-center border-0 focus:ring-0 text-sm"
          data-testid="quantity-input">
        
        <button
          (click)="increaseQuantity()"
          [disabled]="quantity >= maxQuantity || (loading$ | async)"
          class="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>

      <!-- Add to Cart Button -->
      <button
        (click)="addToCart()"
        [disabled]="!canAddToCart || (loading$ | async)"
        [class]="buttonClasses"
        [attr.data-testid]="'add-to-cart-' + product?.id">
        
        <!-- Loading Spinner -->
        <svg *ngIf="loading$ | async" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        
        <!-- Cart Icon (when not loading) -->
        <svg *ngIf="!(loading$ | async)" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5"></path>
        </svg>
        
        <span>{{ buttonText }}</span>
      </button>
    </div>

    <!-- Stock Warning -->
    <div *ngIf="product && product.stockQuantity <= lowStockThreshold && product.stockQuantity > 0" 
         class="text-xs text-amber-600 mt-1">
      Only {{ product.stockQuantity }} left in stock
    </div>

    <!-- Out of Stock Message -->
    <div *ngIf="product && product.stockQuantity <= 0" 
         class="text-xs text-red-600 mt-1">
      Out of stock
    </div>
  `
})
export class AddToCartComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() variant: any = null; // ProductVariant when implemented
  @Input() quantity = 1;
  @Input() showQuantitySelector = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() style: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() fullWidth = false;
  @Input() lowStockThreshold = 5;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() added = new EventEmitter<{ product: Product; quantity: number }>();

  loading$: Observable<boolean>;
  currentQuantity$: Observable<number>;

  constructor(private store: Store) {
    this.loading$ = this.store.select(CartSelectors.selectCartLoading);
    this.currentQuantity$ = this.store.select(CartSelectors.selectCartItemQuantity(this.product?.id || 0));
  }

  ngOnInit(): void {
    // Update current quantity selector when product changes
    if (this.product) {
      this.currentQuantity$ = this.store.select(CartSelectors.selectCartItemQuantity(this.product.id));
    }
  }

  get maxQuantity(): number {
    return this.product?.stockQuantity || 999;
  }

  get canAddToCart(): boolean {
    return !!(
      this.product && 
      this.product.stockQuantity > 0 && 
      this.quantity > 0 && 
      this.quantity <= this.maxQuantity
    );
  }

  get buttonText(): string {
    if (!this.product) return 'Add to Cart';
    if (this.product.stockQuantity <= 0) return 'Out of Stock';
    return 'Add to Cart';
  }

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const styleClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300', 
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 disabled:border-gray-300 disabled:text-gray-300'
    };

    const widthClass = this.fullWidth ? 'w-full' : '';
    
    return `${baseClasses} ${sizeClasses[this.size]} ${styleClasses[this.style]} ${widthClass}`;
  }

  addToCart(): void {
    if (!this.canAddToCart || !this.product) return;

    const addToCartItem: AddToCart = {
      productId: this.product.id,
      quantity: this.quantity,
      productVariantId: this.variant?.id,
      variantOptions: this.variant ? JSON.stringify(this.variant.options) : undefined
    };

    this.store.dispatch(CartActions.addToCart({ item: addToCartItem }));
    this.added.emit({ product: this.product, quantity: this.quantity });
  }

  increaseQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
      this.quantityChange.emit(this.quantity);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
    }
  }

  onQuantityInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    
    if (!isNaN(value) && value >= 1 && value <= this.maxQuantity) {
      this.quantity = value;
      this.quantityChange.emit(this.quantity);
    } else {
      // Reset to current quantity if invalid
      target.value = this.quantity.toString();
    }
  }
}