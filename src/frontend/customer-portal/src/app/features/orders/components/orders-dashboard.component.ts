import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../services/order.service';
import { 
  Order, 
  OrderStatus, 
  OrderFilterRequest, 
  PagedResult,
  OrderStatistics,
  getStatusColor,
  formatOrderDate
} from '../models/order.models';

@Component({
  selector: 'app-orders-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900" data-testid="orders-title">
            My Orders
          </h1>
          <p class="text-gray-600 mt-2">
            Track and manage your orders
          </p>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" *ngIf="statistics">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Orders</p>
                <p class="text-2xl font-semibold text-gray-900">{{ statistics.totalOrders }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Processing</p>
                <p class="text-2xl font-semibold text-gray-900">{{ statistics.processingOrders }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Delivered</p>
                <p class="text-2xl font-semibold text-gray-900">{{ statistics.deliveredOrders }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total Spent</p>
                <p class="text-2xl font-semibold text-gray-900">{{ statistics.totalRevenue | currency }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                [(ngModel)]="filter.searchTerm"
                (ngModelChange)="onFilterChange()"
                placeholder="Order number..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="order-search">
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                [(ngModel)]="filter.status"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="order-status-filter">
                <option [value]="null">All Statuses</option>
                <option *ngFor="let status of orderStatuses" [value]="status">
                  {{ status }}
                </option>
              </select>
            </div>

            <!-- Date From -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                [(ngModel)]="filter.dateFrom"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="order-date-from">
            </div>

            <!-- Date To -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                [(ngModel)]="filter.dateTo"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="order-date-to">
            </div>
          </div>

          <!-- Sort Options -->
          <div class="mt-4 flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              [(ngModel)]="filter.sortBy"
              (ngModelChange)="onFilterChange()"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm">
              <option value="date">Date</option>
              <option value="total">Total Amount</option>
              <option value="status">Status</option>
              <option value="number">Order Number</option>
            </select>
            <button
              (click)="toggleSortOrder()"
              class="p-1 hover:bg-gray-100 rounded"
              data-testid="order-sort-toggle">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="filter.sortDescending" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V8"></path>
                <path *ngIf="!filter.sortDescending" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <p class="ml-3 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- Orders List -->
        <div *ngIf="!loading && orders.length > 0" class="space-y-4">
          <div *ngFor="let order of orders" 
               class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
               (click)="viewOrder(order.id)"
               data-testid="order-card">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    Order #{{ order.orderNumber }}
                  </h3>
                  <p class="text-sm text-gray-600">
                    {{ formatDate(order.createdAt) }}
                  </p>
                </div>
                <span [class]="getStatusClass(order.status)"
                      class="inline-flex px-3 py-1 text-sm font-medium rounded-full">
                  {{ order.status }}
                </span>
              </div>

              <!-- Order Items Preview -->
              <div class="mb-4">
                <div class="flex items-center space-x-4 overflow-x-auto">
                  <div *ngFor="let item of order.items.slice(0, 3)" 
                       class="flex-shrink-0">
                    <div class="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <img *ngIf="item.productImageUrl" 
                           [src]="item.productImageUrl" 
                           [alt]="item.productName"
                           class="w-full h-full object-cover rounded-md">
                      <svg *ngIf="!item.productImageUrl" 
                           class="w-8 h-8 text-gray-400" 
                           fill="none" 
                           stroke="currentColor" 
                           viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div *ngIf="order.items.length > 3" 
                       class="flex-shrink-0 text-sm text-gray-600">
                    +{{ order.items.length - 3 }} more items
                  </div>
                </div>
              </div>

              <!-- Order Summary -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="text-sm text-gray-600">
                  {{ order.items.length }} item(s)
                </div>
                <div class="text-lg font-semibold text-gray-900">
                  {{ order.totalAmount | currency }}
                </div>
              </div>

              <!-- Order Actions -->
              <div class="flex items-center justify-end space-x-2 mt-4">
                <button
                  (click)="viewOrderDetails($event, order.id)"
                  class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  View Details
                </button>
                <button
                  *ngIf="canReorder(order)"
                  (click)="reorder($event, order.id)"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Reorder
                </button>
                <button
                  *ngIf="canCancel(order)"
                  (click)="cancelOrder($event, order)"
                  class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && orders.length === 0" class="text-center py-12">
          <div class="bg-white rounded-lg shadow p-8">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p class="text-gray-600 mb-6">
              {{ filter.searchTerm || filter.status ? 'Try adjusting your filters' : 'Start shopping to see your orders here' }}
            </p>
            <button
              (click)="filter.searchTerm || filter.status ? clearFilters() : navigateToProducts()"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              {{ filter.searchTerm || filter.status ? 'Clear Filters' : 'Start Shopping' }}
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading && totalPages > 1" class="mt-8 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} orders
          </div>
          <div class="flex items-center space-x-2">
            <button
              (click)="previousPage()"
              [disabled]="!hasPreviousPage"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span class="px-4 py-2 text-sm text-gray-700">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="!hasNextPage"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OrdersDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  orders: Order[] = [];
  statistics?: OrderStatistics;
  loading = false;
  error?: string;
  
  filter: OrderFilterRequest = {
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'date',
    sortDescending: true
  };
  
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;
  
  orderStatuses = Object.values(OrderStatus);
  Math = Math;
  
  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadOrders();
    this.loadStatistics();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadOrders(): void {
    this.loading = true;
    this.error = undefined;
    
    this.orderService.getMyOrders(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResult<Order>) => {
          this.orders = result.items;
          this.totalCount = result.totalCount;
          this.currentPage = result.pageNumber;
          this.totalPages = result.totalPages;
          this.hasPreviousPage = result.hasPreviousPage;
          this.hasNextPage = result.hasNextPage;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load orders. Please try again.';
          this.loading = false;
          console.error('Error loading orders:', err);
        }
      });
  }
  
  loadStatistics(): void {
    this.orderService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
        },
        error: (err) => {
          console.error('Error loading statistics:', err);
        }
      });
  }
  
  onFilterChange(): void {
    this.filter.pageNumber = 1;
    this.loadOrders();
  }
  
  clearFilters(): void {
    this.filter = {
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'date',
      sortDescending: true
    };
    this.loadOrders();
  }
  
  toggleSortOrder(): void {
    this.filter.sortDescending = !this.filter.sortDescending;
    this.loadOrders();
  }
  
  previousPage(): void {
    if (this.hasPreviousPage) {
      this.filter.pageNumber = this.currentPage - 1;
      this.loadOrders();
    }
  }
  
  nextPage(): void {
    if (this.hasNextPage) {
      this.filter.pageNumber = this.currentPage + 1;
      this.loadOrders();
    }
  }
  
  viewOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }
  
  viewOrderDetails(event: Event, orderId: string): void {
    event.stopPropagation();
    this.viewOrder(orderId);
  }
  
  reorder(event: Event, orderId: string): void {
    event.stopPropagation();
    
    this.orderService.reorder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Navigate to cart after successful reorder
          this.router.navigate(['/cart']);
        },
        error: (err) => {
          this.error = 'Failed to reorder. Please try again.';
          console.error('Error reordering:', err);
        }
      });
  }
  
  cancelOrder(event: Event, order: Order): void {
    event.stopPropagation();
    
    // In a real app, you'd show a confirmation dialog
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;
    
    this.orderService.cancelOrder(order.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          // Update the order in the list
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
          }
          this.loadStatistics();
        },
        error: (err) => {
          this.error = 'Failed to cancel order. Please try again.';
          console.error('Error cancelling order:', err);
        }
      });
  }
  
  canCancel(order: Order): boolean {
    return [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing]
      .includes(order.status);
  }
  
  canReorder(order: Order): boolean {
    return order.status === OrderStatus.Delivered;
  }
  
  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }
  
  formatDate(dateString: string): string {
    return formatOrderDate(dateString);
  }
  
  getStatusClass(status: OrderStatus): string {
    return getStatusColor(status);
  }
}