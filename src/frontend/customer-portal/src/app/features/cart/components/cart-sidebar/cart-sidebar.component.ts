import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartItem, Cart } from '../../models/cart.model';
import * as CartActions from '../../store/cart.actions';
import * as CartSelectors from '../../store/cart.selectors';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CartItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Sidebar Overlay -->
    <div 
      *ngIf="cartOpen$ | async"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
      (click)="closeCart()"
      data-testid="cart-overlay">
    </div>

    <!-- Sidebar -->
    <div 
      [class.translate-x-0]="cartOpen$ | async"
      [class.translate-x-full]="!(cartOpen$ | async)"
      class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
      data-testid="cart-sidebar">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Shopping Cart</h2>
        <button
          (click)="closeCart()"
          class="text-gray-400 hover:text-gray-600 p-2 -mr-2 transition-colors"
          data-testid="close-cart">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Cart Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Loading State -->
        <div *ngIf="loading$ | async" class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading cart...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error$ | async as error" class="p-4 bg-red-50 border-l-4 border-red-400">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Empty Cart -->
        <div *ngIf="!(loading$ | async) && (isEmpty$ | async)" class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 class="text-sm font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p class="text-sm text-gray-500 mb-4">Add some items to get started</p>
            <button 
              (click)="closeCartAndNavigate('/products')"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>

        <!-- Cart Items -->
        <div *ngIf="!(loading$ | async) && !(isEmpty$ | async)" class="flex-1 flex flex-col">
          <!-- Items List -->
          <div class="flex-1 overflow-y-auto px-4 py-2" data-testid="cart-items-list">
            <app-cart-item
              *ngFor="let item of items$ | async; trackBy: trackByItemId"
              [item]="item"
              [updating]="(loading$ | async) || false"
              (quantityChange)="onQuantityChange($event)"
              (remove)="onRemoveItem($event)"
              (productClick)="closeCart()">
            </app-cart-item>
          </div>

          <!-- Cart Summary -->
          <div class="border-t border-gray-200 p-4 bg-gray-50">
            <div class="flex items-center justify-between text-base font-medium text-gray-900 mb-4">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{{ (subTotal$ | async) | currency }}</span>
            </div>
            
            <p class="text-xs text-gray-500 mb-4">
              Shipping and taxes calculated at checkout.
            </p>
            
            <div class="space-y-2">
              <button 
                (click)="navigateToCheckout()"
                [disabled]="(loading$ | async) || false"
                class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                data-testid="checkout-button">
                Checkout
              </button>
              
              <button 
                (click)="navigateToCart()"
                class="w-full bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                View Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartSidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cart$: Observable<Cart | null>;
  items$: Observable<CartItem[]>;
  cartOpen$: Observable<boolean>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  isEmpty$: Observable<boolean>;
  subTotal$: Observable<number>;
  itemCount$: Observable<number>;

  constructor(
    private store: Store
  ) {
    this.cart$ = this.store.select(CartSelectors.selectCart);
    this.items$ = this.store.select(CartSelectors.selectCartItems);
    this.cartOpen$ = this.store.select(CartSelectors.selectCartOpen);
    this.loading$ = this.store.select(CartSelectors.selectCartLoading);
    this.error$ = this.store.select(CartSelectors.selectCartError);
    this.isEmpty$ = this.store.select(CartSelectors.selectCartIsEmpty);
    this.subTotal$ = this.store.select(CartSelectors.selectCartSubTotal);
    this.itemCount$ = this.store.select(CartSelectors.selectCartItemCount);
  }

  ngOnInit(): void {
    // Load cart when component initializes
    this.store.dispatch(CartActions.loadCart());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByItemId(index: number, item: CartItem): number {
    return item.id;
  }

  closeCart(): void {
    this.store.dispatch(CartActions.closeCart());
  }

  onQuantityChange(event: { productId: number; quantity: number }): void {
    this.store.dispatch(CartActions.updateCartItem({ 
      productId: event.productId, 
      update: { quantity: event.quantity }
    }));
  }

  onRemoveItem(productId: number): void {
    this.store.dispatch(CartActions.removeFromCart({ productId }));
  }

  navigateToCheckout(): void {
    this.closeCart();
    // TODO: Navigate to checkout page when implemented
    console.log('Navigate to checkout');
  }

  navigateToCart(): void {
    this.closeCart();
    // TODO: Navigate to cart page when implemented
    console.log('Navigate to cart page');
  }

  closeCartAndNavigate(path: string): void {
    this.closeCart();
    // TODO: Navigate to specified path
    console.log('Navigate to:', path);
  }
}