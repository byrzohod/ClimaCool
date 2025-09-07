import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../orders/services/order.service';
import { Order, OrderStatus, OrderFilterRequest, PagedResult, OrderStatistics, getStatusColor, formatOrderDate } from '../../orders/models/order.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Order Management</h1>
          <p class="text-gray-600 mt-2">Manage and track all customer orders</p>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Orders</p>
                <p class="text-2xl font-bold text-gray-900">{{ statistics.totalOrders || 0 }}</p>
              </div>
              <div class="bg-blue-100 rounded-full p-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Pending Orders</p>
                <p class="text-2xl font-bold text-yellow-600">{{ statistics.pendingOrders || 0 }}</p>
              </div>
              <div class="bg-yellow-100 rounded-full p-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Processing</p>
                <p class="text-2xl font-bold text-indigo-600">{{ statistics.processingOrders || 0 }}</p>
              </div>
              <div class="bg-indigo-100 rounded-full p-3">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Revenue</p>
                <p class="text-2xl font-bold text-green-600">{{ statistics.totalRevenue | currency }}</p>
              </div>
              <div class="bg-green-100 rounded-full p-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                [(ngModel)]="filter.status"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option *ngFor="let status of orderStatuses" [value]="status">{{ status }}</option>
              </select>
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input 
                type="date"
                [(ngModel)]="filter.dateFrom"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input 
                type="date"
                [(ngModel)]="filter.dateTo"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input 
                type="text"
                [(ngModel)]="filter.searchTerm"
                (keyup.enter)="applyFilters()"
                placeholder="Order #, customer, product..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
          </div>

          <div class="flex justify-between items-center mt-4">
            <button 
              (click)="resetFilters()"
              class="text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
            <button 
              (click)="applyFilters()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" (click)="sort('number')">
                    Order # 
                    <span *ngIf="filter.sortBy === 'number'" class="ml-1">
                      {{ filter.sortDescending ? '↓' : '↑' }}
                    </span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" (click)="sort('date')">
                    Date
                    <span *ngIf="filter.sortBy === 'date'" class="ml-1">
                      {{ filter.sortDescending ? '↓' : '↑' }}
                    </span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" (click)="sort('status')">
                    Status
                    <span *ngIf="filter.sortBy === 'status'" class="ml-1">
                      {{ filter.sortDescending ? '↓' : '↑' }}
                    </span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" (click)="sort('total')">
                    Total
                    <span *ngIf="filter.sortBy === 'total'" class="ml-1">
                      {{ filter.sortDescending ? '↓' : '↑' }}
                    </span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let order of orders">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">#{{ order.orderNumber }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}
                    </div>
                    <div class="text-sm text-gray-500">{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(order.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getStatusClass(order.status) + ' px-2 py-1 text-xs rounded-full font-medium'">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ order.totalAmount | currency }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button 
                        (click)="viewOrder(order)"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button 
                        (click)="updateStatus(order)"
                        class="text-green-600 hover:text-green-900"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div *ngIf="orders.length === 0 && !loading" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>

          <!-- Loading State -->
          <div *ngIf="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-600">Loading orders...</p>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ ((filter.pageNumber || 1) - 1) * (filter.pageSize || 10) + 1 }} to 
              {{ Math.min((filter.pageNumber || 1) * (filter.pageSize || 10), totalCount) }} of 
              {{ totalCount }} results
            </div>
            <div class="flex space-x-2">
              <button 
                (click)="goToPage((filter.pageNumber || 1) - 1)"
                [disabled]="(filter.pageNumber || 1) === 1"
                class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="px-3 py-1 text-sm">
                Page {{ filter.pageNumber || 1 }} of {{ totalPages }}
              </span>
              <button 
                (click)="goToPage((filter.pageNumber || 1) + 1)"
                [disabled]="(filter.pageNumber || 1) === totalPages"
                class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div *ngIf="showUpdateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Update Order Status</h3>
        <p class="text-sm text-gray-600 mb-4">Order #{{ selectedOrder?.orderNumber }}</p>
        
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
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
          <textarea 
            [(ngModel)]="statusNotes"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Add any relevant notes..."
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
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  statistics: OrderStatistics = {} as OrderStatistics;
  filter: OrderFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'date',
    sortDescending: true
  };
  totalCount = 0;
  totalPages = 0;
  loading = false;
  orderStatuses = Object.values(OrderStatus);
  showUpdateModal = false;
  selectedOrder: Order | null = null;
  newStatus: OrderStatus | '' = '';
  statusNotes = '';
  updatingStatus = false;
  Math = Math;

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
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadStatistics();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders(this.filter).subscribe({
      next: (result) => {
        this.orders = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  loadStatistics() {
    this.orderService.getOverallStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  applyFilters() {
    this.filter.pageNumber = 1;
    this.loadOrders();
  }

  resetFilters() {
    this.filter = {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'date',
      sortDescending: true
    };
    this.loadOrders();
  }

  sort(field: 'date' | 'total' | 'status' | 'number') {
    if (this.filter.sortBy === field) {
      this.filter.sortDescending = !this.filter.sortDescending;
    } else {
      this.filter.sortBy = field;
      this.filter.sortDescending = true;
    }
    this.loadOrders();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.filter.pageNumber = page;
      this.loadOrders();
    }
  }

  viewOrder(order: Order) {
    this.router.navigate(['/admin/orders', order.id]);
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
      this.loadOrders();
      this.loadStatistics();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      this.updatingStatus = false;
    }
  }

  getStatusClass(status: OrderStatus): string {
    return getStatusColor(status);
  }

  formatDate(dateString: string): string {
    return formatOrderDate(dateString);
  }
}