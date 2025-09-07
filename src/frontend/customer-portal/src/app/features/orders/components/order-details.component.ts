import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, switchMap, map, tap, catchError, of } from 'rxjs';
import { OrderService } from '../services/order.service';
import { Order, OrderStatus, TrackingInfo, OrderStatusHistory, getStatusColor, getStatusIcon, canCancelOrder, formatOrderDate } from '../models/order.models';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span class="ml-3">{{ error }}</span>
          </div>
        </div>

        <!-- Order Details -->
        <div *ngIf="order$ | async as order" class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <button 
                  (click)="goBack()" 
                  class="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Back to Orders
                </button>
                <h1 class="text-2xl font-bold text-gray-900">Order #{{ order.orderNumber }}</h1>
                <p class="text-sm text-gray-600 mt-1">Placed on {{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="flex items-center space-x-4">
                <span [class]="getStatusClass(order.status) + ' px-3 py-1 rounded-full text-sm font-medium'">
                  {{ order.status }}
                </span>
                <div class="flex space-x-2">
                  <button 
                    *ngIf="canCancel(order)"
                    (click)="cancelOrder(order)"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                  <button 
                    (click)="reorder(order)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Timeline -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Order Status</h2>
            <div class="relative">
              <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300"></div>
              <div *ngIf="trackingInfo$ | async as tracking" class="space-y-6">
                <div *ngFor="let event of tracking.statusHistory; let i = index; let last = last" class="relative flex items-start">
                  <div [class]="'z-10 flex items-center justify-center w-8 h-8 rounded-full ' + (last ? 'bg-blue-600' : 'bg-gray-400')">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-4 min-w-0 flex-1">
                    <h3 class="text-sm font-medium text-gray-900">{{ event.status }}</h3>
                    <p class="text-sm text-gray-600">{{ event.description }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ formatDate(event.timestamp) }}</p>
                    <p *ngIf="event.notes" class="text-sm text-gray-600 mt-1 italic">{{ event.notes }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Estimated Delivery -->
              <div *ngIf="(trackingInfo$ | async)?.estimatedDelivery" class="mt-6 p-4 bg-blue-50 rounded-lg">
                <p class="text-sm font-medium text-blue-900">
                  Estimated Delivery: {{ formatDate((trackingInfo$ | async)!.estimatedDelivery!) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Order Items</h2>
            <div class="space-y-4">
              <div *ngFor="let item of order.items" class="flex items-center space-x-4 pb-4 border-b last:border-0">
                <img 
                  [src]="item.productImageUrl || 'assets/images/product-placeholder.png'" 
                  [alt]="item.productName"
                  class="w-20 h-20 object-cover rounded-lg"
                >
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ item.productName }}</h3>
                  <p *ngIf="item.variantName" class="text-sm text-gray-600">{{ item.variantName }}</p>
                  <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900">{{ item.totalPrice | currency }}</p>
                  <p class="text-sm text-gray-600">{{ item.price | currency }} each</p>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="mt-6 pt-6 border-t space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal</span>
                <span class="text-gray-900">{{ order.subTotal | currency }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tax</span>
                <span class="text-gray-900">{{ order.taxAmount | currency }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Shipping</span>
                <span class="text-gray-900">{{ order.shippingAmount | currency }}</span>
              </div>
              <div class="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{{ order.totalAmount | currency }}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Shipping Address -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">Shipping Address</h2>
              <div class="text-sm text-gray-600 space-y-1">
                <p class="font-medium text-gray-900">
                  {{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}
                </p>
                <p *ngIf="order.shippingAddress.company">{{ order.shippingAddress.company }}</p>
                <p>{{ order.shippingAddress.addressLine1 }}</p>
                <p *ngIf="order.shippingAddress.addressLine2">{{ order.shippingAddress.addressLine2 }}</p>
                <p>
                  {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.postalCode }}
                </p>
                <p>{{ order.shippingAddress.country }}</p>
                <p *ngIf="order.shippingAddress.phoneNumber" class="pt-2">
                  Phone: {{ order.shippingAddress.phoneNumber }}
                </p>
              </div>
            </div>

            <!-- Billing Address -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">Billing Address</h2>
              <div class="text-sm text-gray-600 space-y-1">
                <p class="font-medium text-gray-900">
                  {{ order.billingAddress.firstName }} {{ order.billingAddress.lastName }}
                </p>
                <p *ngIf="order.billingAddress.company">{{ order.billingAddress.company }}</p>
                <p>{{ order.billingAddress.addressLine1 }}</p>
                <p *ngIf="order.billingAddress.addressLine2">{{ order.billingAddress.addressLine2 }}</p>
                <p>
                  {{ order.billingAddress.city }}, {{ order.billingAddress.state }} {{ order.billingAddress.postalCode }}
                </p>
                <p>{{ order.billingAddress.country }}</p>
                <p *ngIf="order.billingAddress.phoneNumber" class="pt-2">
                  Phone: {{ order.billingAddress.phoneNumber }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tracking Information -->
          <div *ngIf="order.trackingNumber" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Tracking Information</h2>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Carrier</p>
                <p class="font-medium">{{ order.carrier || 'Standard Shipping' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Tracking Number</p>
                <p class="font-medium text-blue-600">{{ order.trackingNumber }}</p>
              </div>
              <button 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Track Package
              </button>
            </div>
          </div>

          <!-- Order Notes -->
          <div *ngIf="order.notes" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Order Notes</h2>
            <p class="text-gray-600">{{ order.notes }}</p>
          </div>

          <!-- Status History -->
          <div *ngIf="statusHistory$ | async as history" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Status History</h2>
            <div class="space-y-3">
              <div *ngFor="let item of history" class="flex items-start space-x-3 pb-3 border-b last:border-0">
                <div class="flex-shrink-0">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span [class]="getStatusClass(item.fromStatus) + ' px-2 py-1 rounded text-xs font-medium'">
                      {{ item.fromStatus }}
                    </span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                    <span [class]="getStatusClass(item.toStatus) + ' px-2 py-1 rounded text-xs font-medium'">
                      {{ item.toStatus }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ formatDate(item.changedAt) }}</p>
                  <p *ngIf="item.notes" class="text-sm text-gray-600 mt-1">{{ item.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Order Modal -->
    <div *ngIf="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Cancel Order</h3>
        <p class="text-gray-600 mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
          <textarea 
            [(ngModel)]="cancellationReason"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Please provide a reason for cancellation..."
            required
          ></textarea>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="confirmCancel()"
            [disabled]="!cancellationReason || cancellingOrder"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ cancellingOrder ? 'Cancelling...' : 'Cancel Order' }}
          </button>
          <button 
            (click)="showCancelModal = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Keep Order
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OrderDetailsComponent implements OnInit {
  order$!: Observable<Order>;
  trackingInfo$!: Observable<TrackingInfo>;
  statusHistory$!: Observable<OrderStatusHistory[]>;
  loading = true;
  error = '';
  showCancelModal = false;
  cancellationReason = '';
  cancellingOrder = false;
  private orderId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.order$ = this.route.params.pipe(
      switchMap(params => {
        this.orderId = params['id'];
        return this.orderService.getOrder(this.orderId);
      }),
      tap(() => this.loading = false),
      catchError(err => {
        this.loading = false;
        this.error = 'Failed to load order details. Please try again.';
        console.error('Error loading order:', err);
        return of(null as any);
      })
    );

    this.trackingInfo$ = this.route.params.pipe(
      switchMap(params => this.orderService.getTrackingInfo(params['id'])),
      catchError(err => {
        console.error('Error loading tracking info:', err);
        return of({} as TrackingInfo);
      })
    );

    this.statusHistory$ = this.route.params.pipe(
      switchMap(params => this.orderService.getOrderHistory(params['id'])),
      catchError(err => {
        console.error('Error loading status history:', err);
        return of([]);
      })
    );
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  cancelOrder(order: Order) {
    if (this.canCancel(order)) {
      this.showCancelModal = true;
      this.cancellationReason = '';
    }
  }

  async confirmCancel() {
    if (!this.cancellationReason.trim()) {
      return;
    }

    this.cancellingOrder = true;
    try {
      await this.orderService.cancelOrder(this.orderId, this.cancellationReason).toPromise();
      this.showCancelModal = false;
      // Reload order data
      this.order$ = this.orderService.getOrder(this.orderId);
      this.trackingInfo$ = this.orderService.getTrackingInfo(this.orderId);
      this.statusHistory$ = this.orderService.getOrderHistory(this.orderId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      this.error = 'Failed to cancel order. Please try again.';
    } finally {
      this.cancellingOrder = false;
    }
  }

  async reorder(order: Order) {
    try {
      const result = await this.orderService.reorder(order.id).toPromise();
      // Navigate to cart
      this.router.navigate(['/cart']);
    } catch (error) {
      console.error('Error reordering:', error);
      this.error = 'Failed to add items to cart. Please try again.';
    }
  }

  canCancel(order: Order): boolean {
    return canCancelOrder(order);
  }

  getStatusClass(status: OrderStatus): string {
    return getStatusColor(status);
  }

  getStatusIcon(status: OrderStatus): string {
    return getStatusIcon(status);
  }

  formatDate(dateString: string): string {
    return formatOrderDate(dateString);
  }
}