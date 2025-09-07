import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, switchMap, tap, catchError, of } from 'rxjs';
import { OrderService } from '../../orders/services/order.service';
import { Order, OrderStatus, TrackingInfo, OrderStatusHistory, getStatusColor, formatOrderDate } from '../../orders/models/order.models';

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
          <!-- Header with Actions -->
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
                <button 
                  (click)="updateStatus(order)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <button 
                (click)="printOrder(order)"
                class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print Order
              </button>
              <button 
                (click)="exportOrder(order)"
                class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export PDF
              </button>
              <button 
                (click)="emailCustomer(order)"
                class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Email Customer
              </button>
            </div>
          </div>

          <!-- Customer Information -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Customer Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Contact Details</h3>
                <div class="text-sm text-gray-600 space-y-1">
                  <p class="font-medium text-gray-900">
                    {{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}
                  </p>
                  <p *ngIf="order.shippingAddress.phoneNumber">
                    Phone: {{ order.shippingAddress.phoneNumber }}
                  </p>
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Order Summary</h3>
                <div class="text-sm text-gray-600 space-y-1">
                  <p>Items: {{ order.items.length }}</p>
                  <p>Total: {{ order.totalAmount | currency }}</p>
                  <p>Payment Status: <span class="text-green-600 font-medium">Paid</span></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Items with Inventory -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Order Items</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let item of order.items">
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <img 
                          [src]="item.productImageUrl || 'assets/images/product-placeholder.png'" 
                          [alt]="item.productName"
                          class="w-10 h-10 object-cover rounded-lg mr-3"
                        >
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ item.productName }}</p>
                          <p *ngIf="item.variantName" class="text-xs text-gray-500">{{ item.variantName }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ item.productId.substring(0, 8) }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ item.quantity }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ item.price | currency }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.totalPrice | currency }}</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Order Summary -->
            <div class="mt-6 pt-6 border-t">
              <div class="flex justify-end">
                <div class="w-64 space-y-2">
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
            </div>
          </div>

          <!-- Shipping & Billing -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Shipping Address -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-start mb-4">
                <h2 class="text-lg font-semibold">Shipping Address</h2>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
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
              <div class="flex justify-between items-start mb-4">
                <h2 class="text-lg font-semibold">Billing Address</h2>
                <button class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
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

          <!-- Tracking & Shipping -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Shipping Information</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Carrier</label>
                <input 
                  type="text"
                  [(ngModel)]="shippingCarrier"
                  [value]="order.carrier || ''"
                  placeholder="e.g., UPS, FedEx, USPS"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                <input 
                  type="text"
                  [(ngModel)]="trackingNumber"
                  [value]="order.trackingNumber || ''"
                  placeholder="Enter tracking number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <button 
              (click)="updateShippingInfo(order)"
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Shipping Info
            </button>
          </div>

          <!-- Order Timeline -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Order Timeline</h2>
            <div class="relative">
              <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300"></div>
              <div *ngIf="statusHistory$ | async as history" class="space-y-6">
                <div *ngFor="let item of history; let i = index; let last = last" class="relative flex items-start">
                  <div [class]="'z-10 flex items-center justify-center w-8 h-8 rounded-full ' + (i === 0 ? 'bg-blue-600' : 'bg-gray-400')">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-4 min-w-0 flex-1">
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
                    <p *ngIf="item.changedBy" class="text-xs text-gray-500">By: {{ item.changedBy }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Internal Notes -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Internal Notes</h2>
            <textarea 
              [(ngModel)]="internalNotes"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Add internal notes about this order..."
            ></textarea>
            <button 
              (click)="saveNotes()"
              class="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div *ngIf="showUpdateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Update Order Status</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
          <p class="text-sm text-gray-600">{{ selectedOrder?.status }}</p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
          <select 
            [(ngModel)]="newStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a status...</option>
            <option *ngFor="let status of getValidTransitions(selectedOrder?.status)" [value]="status">
              {{ status }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea 
            [(ngModel)]="statusNotes"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Add notes about this status change..."
          ></textarea>
        </div>

        <div class="flex space-x-3">
          <button 
            (click)="confirmUpdateStatus()"
            [disabled]="!newStatus || updatingStatus"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ updatingStatus ? 'Updating...' : 'Update Status' }}
          </button>
          <button 
            (click)="showUpdateModal = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminOrderDetailsComponent implements OnInit {
  order$!: Observable<Order>;
  statusHistory$!: Observable<OrderStatusHistory[]>;
  loading = true;
  error = '';
  showUpdateModal = false;
  selectedOrder: Order | null = null;
  newStatus: OrderStatus | '' = '';
  statusNotes = '';
  updatingStatus = false;
  trackingNumber = '';
  shippingCarrier = '';
  internalNotes = '';

  private orderId!: string;
  private validTransitions: { [key in OrderStatus]: OrderStatus[] } = {
    [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
    [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
    [OrderStatus.Processing]: [OrderStatus.Shipped, OrderStatus.Cancelled],
    [OrderStatus.Shipped]: [OrderStatus.Delivered],
    [OrderStatus.Delivered]: [OrderStatus.Refunded],
    [OrderStatus.Cancelled]: [OrderStatus.Refunded],
    [OrderStatus.Refunded]: []
  };

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
      tap(order => {
        this.loading = false;
        this.trackingNumber = order.trackingNumber || '';
        this.shippingCarrier = order.carrier || '';
      }),
      catchError(err => {
        this.loading = false;
        this.error = 'Failed to load order details. Please try again.';
        console.error('Error loading order:', err);
        return of(null as any);
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
    this.router.navigate(['/admin/orders']);
  }

  updateStatus(order: Order) {
    this.selectedOrder = order;
    this.newStatus = '';
    this.statusNotes = '';
    this.showUpdateModal = true;
  }

  getValidTransitions(status?: OrderStatus): OrderStatus[] {
    if (!status) return [];
    return this.validTransitions[status] || [];
  }

  async confirmUpdateStatus() {
    if (!this.selectedOrder || !this.newStatus) return;

    this.updatingStatus = true;
    try {
      await this.orderService.updateOrderStatus(
        this.selectedOrder.id, 
        this.newStatus as OrderStatus, 
        this.statusNotes || undefined
      ).toPromise();
      
      this.showUpdateModal = false;
      // Reload order data
      this.order$ = this.orderService.getOrder(this.orderId);
      this.statusHistory$ = this.orderService.getOrderHistory(this.orderId);
    } catch (error) {
      console.error('Error updating order status:', error);
      this.error = 'Failed to update order status. Please try again.';
    } finally {
      this.updatingStatus = false;
    }
  }

  async updateShippingInfo(order: Order) {
    // This would typically call an API endpoint to update shipping info
    console.log('Updating shipping info:', {
      orderId: order.id,
      carrier: this.shippingCarrier,
      trackingNumber: this.trackingNumber
    });
    // Show success message
  }

  saveNotes() {
    // This would typically save internal notes to the backend
    console.log('Saving internal notes:', this.internalNotes);
    // Show success message
  }

  printOrder(order: Order) {
    // Implement print functionality
    window.print();
  }

  exportOrder(order: Order) {
    // Implement PDF export
    console.log('Exporting order as PDF:', order.id);
  }

  emailCustomer(order: Order) {
    // Implement email functionality
    console.log('Sending email to customer for order:', order.id);
  }

  getStatusClass(status: OrderStatus): string {
    return getStatusColor(status);
  }

  formatDate(dateString: string): string {
    return formatOrderDate(dateString);
  }
}