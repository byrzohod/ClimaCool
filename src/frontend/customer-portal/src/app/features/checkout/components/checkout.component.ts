import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, Observable } from 'rxjs';

import { AddressFormComponent } from './address-form.component';
import { OrderSummaryComponent } from './order-summary.component';
import { CheckoutStepsComponent } from './checkout-steps.component';

import { Address, AddressType, CreateOrderRequest, Order } from '../models/checkout.models';
import { CartItem } from '../../cart/models/cart.model';
import { CheckoutActions } from '../store/checkout.actions';
import * as CheckoutSelectors from '../store/checkout.selectors';
import * as CartActions from '../../cart/store/cart.actions';
import * as CartSelectors from '../../cart/store/cart.selectors';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddressFormComponent,
    OrderSummaryComponent,
    CheckoutStepsComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-8" 
         *ngIf="{ 
           currentStep: currentStep$ | async,
           steps: steps$ | async,
           shippingAddress: shippingAddress$ | async,
           billingAddress: billingAddress$ | async,
           sameAsShipping: sameAsShipping$ | async,
           notes: notes$ | async,
           loading: loading$ | async,
           error: error$ | async,
           cartItems: cartItems$ | async,
           completedOrder: completedOrder$ | async
         } as vm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900" data-testid="checkout-title">
            Checkout
          </h1>
          <p class="text-gray-600 mt-2">
            Complete your order
          </p>
        </div>

        <!-- Progress Steps -->
        <app-checkout-steps
          [currentStep]="vm.currentStep || 1"
          [steps]="vm.steps || []"
          data-testid="checkout-steps">
        </app-checkout-steps>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Step 1: Shipping Address -->
            <div *ngIf="(currentStep$ | async) === 1" data-testid="checkout-step-shipping">
              <app-address-form
                title="Shipping Address"
                [address]="(shippingAddress$ | async) || undefined"
                [addressType]="AddressType.Shipping"
                (addressChange)="onShippingAddressChange($event)"
                (validChange)="onShippingValidChange($event)"
                data-testid="checkout-shipping-form">
              </app-address-form>

              <!-- Same as Shipping Checkbox -->
              <div class="bg-white p-6 rounded-lg border border-gray-200 mt-4">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    [checked]="sameAsShipping$ | async"
                    (change)="onSameAsShippingChange($event.target.checked)"
                    data-testid="checkout-same-as-shipping"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <label for="sameAsShipping" class="ml-2 block text-sm text-gray-700">
                    Billing address is the same as shipping address
                  </label>
                </div>
              </div>

              <!-- Billing Address (if different) -->
              <div *ngIf="!(sameAsShipping$ | async)" data-testid="checkout-billing-section">
                <app-address-form
                  title="Billing Address"
                  [address]="(billingAddress$ | async) || undefined"
                  [addressType]="AddressType.Billing"
                  (addressChange)="onBillingAddressChange($event)"
                  (validChange)="onBillingValidChange($event)"
                  data-testid="checkout-billing-form">
                </app-address-form>
              </div>

              <!-- Order Notes -->
              <div class="bg-white p-6 rounded-lg border border-gray-200">
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  [value]="notes$ | async"
                  (input)="onNotesChange($any($event.target).value)"
                  data-testid="checkout-notes"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Special instructions for your order...">
                </textarea>
              </div>
            </div>

            <!-- Step 2: Review Order -->
            <div *ngIf="(currentStep$ | async) === 2" data-testid="checkout-step-review">
              <div class="bg-white p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Review Your Order</h3>
                
                <!-- Address Summary -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <!-- Shipping Address -->
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                    <div class="text-sm text-gray-600" data-testid="checkout-review-shipping">
                      <div>{{ shippingAddress?.firstName }} {{ shippingAddress?.lastName }}</div>
                      <div *ngIf="shippingAddress?.company">{{ shippingAddress?.company }}</div>
                      <div>{{ shippingAddress?.addressLine1 }}</div>
                      <div *ngIf="shippingAddress?.addressLine2">{{ shippingAddress?.addressLine2 }}</div>
                      <div>{{ shippingAddress?.city }}, {{ shippingAddress?.state }} {{ shippingAddress?.postalCode }}</div>
                      <div>{{ shippingAddress?.country }}</div>
                      <div *ngIf="shippingAddress?.phoneNumber">{{ shippingAddress?.phoneNumber }}</div>
                    </div>
                  </div>
                  
                  <!-- Billing Address -->
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Billing Address</h4>
                    <div class="text-sm text-gray-600" data-testid="checkout-review-billing">
                      <ng-container *ngIf="sameAsShipping">
                        <div class="text-gray-500 italic">Same as shipping address</div>
                      </ng-container>
                      <ng-container *ngIf="!sameAsShipping">
                        <div>{{ billingAddress?.firstName }} {{ billingAddress?.lastName }}</div>
                        <div *ngIf="billingAddress?.company">{{ billingAddress?.company }}</div>
                        <div>{{ billingAddress?.addressLine1 }}</div>
                        <div *ngIf="billingAddress?.addressLine2">{{ billingAddress?.addressLine2 }}</div>
                        <div>{{ billingAddress?.city }}, {{ billingAddress?.state }} {{ billingAddress?.postalCode }}</div>
                        <div>{{ billingAddress?.country }}</div>
                        <div *ngIf="billingAddress?.phoneNumber">{{ billingAddress?.phoneNumber }}</div>
                      </ng-container>
                    </div>
                  </div>
                </div>

                <!-- Order Notes -->
                <div *ngIf="notes" class="mb-6">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Order Notes</h4>
                  <div class="text-sm text-gray-600" data-testid="checkout-review-notes">
                    {{ notes }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Order Confirmation -->
            <div *ngIf="currentStep === 3" data-testid="checkout-step-confirmation">
              <div class="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Order Confirmed!</h3>
                <p class="text-gray-600 mb-4">
                  Thank you for your order. Your order number is:
                </p>
                <div class="text-xl font-bold text-blue-600 mb-6" data-testid="checkout-order-number">
                  {{ completedOrder?.orderNumber }}
                </div>
                <div class="space-x-4">
                  <button
                    (click)="viewOrder()"
                    class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    data-testid="checkout-view-order">
                    View Order Details
                  </button>
                  <button
                    (click)="continueShopping()"
                    class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    data-testid="checkout-continue-shopping">
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between pt-6" *ngIf="currentStep < 3">
              <button
                *ngIf="currentStep > 1"
                (click)="previousStep()"
                class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                data-testid="checkout-back-button">
                Back
              </button>
              <div *ngIf="currentStep === 1"></div> <!-- Spacer for first step -->
              
              <button
                *ngIf="currentStep === 1"
                (click)="nextStep()"
                [disabled]="!canProceedFromStep1()"
                class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                data-testid="checkout-continue-button">
                Continue to Review
              </button>
              
              <button
                *ngIf="currentStep === 2"
                (click)="placeOrder()"
                [disabled]="loading"
                class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                data-testid="checkout-place-order-button">
                <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ loading ? 'Placing Order...' : 'Place Order' }}</span>
              </button>
            </div>
          </div>

          <!-- Order Summary Sidebar -->
          <div class="lg:col-span-1">
            <app-order-summary
              [cartItems]="cartItems"
              [subtotal]="subtotal"
              [taxAmount]="taxAmount"
              [shippingAmount]="shippingAmount"
              [totalAmount]="totalAmount"
              data-testid="checkout-order-summary">
            </app-order-summary>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" 
             class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md"
             data-testid="checkout-error-message">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Error placing order
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // NgRx Observables
  currentStep$: Observable<number>;
  steps$: Observable<string[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  shippingAddress$: Observable<Address | null>;
  billingAddress$: Observable<Address | null>;
  sameAsShipping$: Observable<boolean>;
  notes$: Observable<string>;
  
  shippingValid$: Observable<boolean>;
  billingValid$: Observable<boolean>;
  canProceed$: Observable<boolean>;
  
  cartItems$: Observable<CartItem[]>;
  subtotal$: Observable<number>;
  
  completedOrder$: Observable<Order | null>;

  // Local computed values for template
  taxAmount = 0;
  shippingAmount = 0;
  totalAmount = 0;

  // Enum references for template
  AddressType = AddressType;

  constructor(
    private store: Store,
    private router: Router
  ) {
    // Initialize observables
    this.currentStep$ = this.store.select(CheckoutSelectors.selectCurrentStep);
    this.steps$ = this.store.select(CheckoutSelectors.selectSteps);
    this.loading$ = this.store.select(CheckoutSelectors.selectCreatingOrder);
    this.error$ = this.store.select(CheckoutSelectors.selectError);
    
    this.shippingAddress$ = this.store.select(CheckoutSelectors.selectShippingAddress);
    this.billingAddress$ = this.store.select(CheckoutSelectors.selectBillingAddress);
    this.sameAsShipping$ = this.store.select(CheckoutSelectors.selectSameAsShipping);
    this.notes$ = this.store.select(CheckoutSelectors.selectOrderNotes);
    
    this.shippingValid$ = this.store.select(CheckoutSelectors.selectShippingValid);
    this.billingValid$ = this.store.select(CheckoutSelectors.selectBillingValid);
    this.canProceed$ = this.store.select(CheckoutSelectors.selectCanProceedFromStep1);
    
    this.cartItems$ = this.store.select(CartSelectors.selectCartItems);
    this.subtotal$ = this.store.select(CartSelectors.selectCartSubTotal);
    
    this.completedOrder$ = this.store.select(CheckoutSelectors.selectCurrentOrder);
  }

  ngOnInit(): void {
    this.loadCartData();
    this.setupTotalCalculations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCartData(): void {
    // Load cart data through NgRx store
    this.store.dispatch(CartActions.loadCart());
    
    // Check if cart is empty and redirect if needed
    this.store.select(CartSelectors.selectCartIsEmpty)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isEmpty => {
        if (isEmpty) {
          this.router.navigate(['/cart']);
        }
      });
  }

  private setupTotalCalculations(): void {
    // Subscribe to subtotal changes and calculate totals
    this.subtotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(subtotal => {
        this.taxAmount = subtotal * 0.08; // 8% tax
        this.shippingAmount = subtotal > 100 ? 0 : 15; // Free shipping over $100
        this.totalAmount = subtotal + this.taxAmount + this.shippingAmount;
      });
  }

  onShippingAddressChange(address: Address): void {
    this.store.dispatch(CheckoutActions.setShippingAddress({ address }));
  }

  onShippingValidChange(valid: boolean): void {
    this.store.dispatch(CheckoutActions.setShippingValid({ valid }));
  }

  onBillingAddressChange(address: Address): void {
    this.store.dispatch(CheckoutActions.setBillingAddress({ address }));
  }

  onBillingValidChange(valid: boolean): void {
    this.store.dispatch(CheckoutActions.setBillingValid({ valid }));
  }

  onSameAsShippingChange(sameAsShipping: boolean): void {
    this.store.dispatch(CheckoutActions.setSameAsShipping({ sameAsShipping }));
  }

  onNotesChange(notes: string): void {
    this.store.dispatch(CheckoutActions.setOrderNotes({ notes }));
  }

  nextStep(): void {
    this.store.dispatch(CheckoutActions.nextStep());
  }

  previousStep(): void {
    this.store.dispatch(CheckoutActions.previousStep());
  }

  placeOrder(): void {
    // Get current checkout data and create order
    this.store.select(CheckoutSelectors.selectCheckoutData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (!data.shippingAddress) {
          this.store.dispatch(CheckoutActions.createOrderFailure({ 
            error: 'Shipping address is required' 
          }));
          return;
        }

        const billingAddr = data.sameAsShipping 
          ? { ...data.shippingAddress, type: AddressType.Billing }
          : data.billingAddress;

        if (!billingAddr) {
          this.store.dispatch(CheckoutActions.createOrderFailure({ 
            error: 'Billing address is required' 
          }));
          return;
        }

        const orderRequest: CreateOrderRequest = {
          shippingAddress: data.shippingAddress,
          billingAddress: billingAddr,
          notes: data.notes || undefined
        };

        this.store.dispatch(CheckoutActions.createOrder({ request: orderRequest }));
      });
  }

  viewOrder(): void {
    this.completedOrder$
      .pipe(takeUntil(this.destroy$))
      .subscribe(order => {
        if (order) {
          this.router.navigate(['/orders', order.id]);
        }
      });
  }

  continueShopping(): void {
    this.store.dispatch(CheckoutActions.resetCheckout());
    this.router.navigate(['/products']);
  }
}