import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartItem, Cart } from '../../models/cart.model';
import * as CartActions from '../../store/cart.actions';
import * as CartSelectors from '../../store/cart.selectors';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, CartItemComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900" data-testid="cart-title">
            Shopping Cart
          </h1>
          <p class="text-gray-600 mt-2">
            Review your items and proceed to checkout
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading$ | async" class="flex items-center justify-center p-8">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading cart...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error$ | async as error" class="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
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
        <div *ngIf="!(loading$ | async) && (isEmpty$ | async)" class="text-center py-12">
          <div class="bg-white p-8 rounded-lg border border-gray-200">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p class="text-gray-500 mb-6">Add some items to get started</p>
            <button 
              (click)="navigateToProducts()"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>

        <!-- Cart Content -->
        <div *ngIf="!(loading$ | async) && !(isEmpty$ | async)" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Cart Items -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Items in your cart</h3>
              
              <div class="space-y-4" data-testid="cart-items-list">
                <app-cart-item
                  *ngFor="let item of items$ | async; trackBy: trackByItemId"
                  [item]="item"
                  [updating]="(loading$ | async) || false"
                  (quantityChange)="onQuantityChange($event)"
                  (remove)="onRemoveItem($event)">
                </app-cart-item>
              </div>

              <!-- Continue Shopping -->
              <div class="mt-6 pt-6 border-t border-gray-200">
                <button
                  (click)="navigateToProducts()"
                  class="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div class="space-y-2 mb-6">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal ({{ (itemCount$ | async) || 0 }} items)</span>
                  <span class="font-medium" data-testid="cart-subtotal">{{ (subTotal$ | async) | currency }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Shipping</span>
                  <span class="text-gray-600">Calculated at checkout</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Tax</span>
                  <span class="text-gray-600">Calculated at checkout</span>
                </div>
              </div>
              
              <div class="border-t border-gray-200 pt-4 mb-6">
                <div class="flex justify-between text-base font-semibold">
                  <span class="text-gray-900">Total</span>
                  <span class="text-gray-900" data-testid="cart-total">{{ (subTotal$ | async) | currency }}</span>
                </div>
              </div>
              
              <button 
                (click)="navigateToCheckout()"
                [disabled]="(loading$ | async) || false"
                class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium mb-4"
                data-testid="checkout-button">
                Proceed to Checkout
              </button>
              
              <p class="text-xs text-gray-500 text-center">
                Shipping and taxes calculated at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cart$: Observable<Cart | null>;
  items$: Observable<CartItem[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  isEmpty$: Observable<boolean>;
  subTotal$: Observable<number>;
  itemCount$: Observable<number>;

  constructor(
    private store: Store,
    private router: Router
  ) {
    this.cart$ = this.store.select(CartSelectors.selectCart);
    this.items$ = this.store.select(CartSelectors.selectCartItems);
    this.loading$ = this.store.select(CartSelectors.selectCartLoading);
    this.error$ = this.store.select(CartSelectors.selectCartError);
    this.isEmpty$ = this.store.select(CartSelectors.selectCartIsEmpty);
    this.subTotal$ = this.store.select(CartSelectors.selectCartSubTotal);
    this.itemCount$ = this.store.select(CartSelectors.selectCartItemCount);
  }

  ngOnInit(): void {
    this.store.dispatch(CartActions.loadCart());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByItemId(index: number, item: CartItem): number {
    return item.id;
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
    this.router.navigate(['/checkout']);
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }
}