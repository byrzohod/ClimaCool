import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header -->
    <header class="bg-white shadow-md relative z-40" data-testid="main-header">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          
          <!-- Logo -->
          <div class="flex items-center">
            <a href="/" class="flex items-center space-x-2" data-testid="logo-link">
              <div class="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-900">ClimaCool</span>
            </a>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-4">
            <!-- Cart Icon -->
            <button
              (click)="toggleCart()"
              class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              data-testid="cart-icon-button">
              
              <!-- Cart Icon -->
              <svg 
                class="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24">
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5M16 11v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4m10 0V7a4 4 0 00-8 0v4m8 0h-10">
                </path>
              </svg>

              <!-- Badge -->
              <span
                class="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center"
                data-testid="cart-badge">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to ClimaCool</h1>
        <p class="text-xl text-gray-600 mb-8">Your HVAC solutions store</p>
        <div class="space-x-4">
          <button class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Shop Products
          </button>
          <button class="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </main>

    <!-- Cart Sidebar -->
    <div 
      *ngIf="cartOpen"
      class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0"
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
        <!-- Empty Cart -->
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 class="text-sm font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p class="text-sm text-gray-500 mb-4">Add some items to get started</p>
            <button 
              (click)="closeCart()"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Overlay -->
    <div 
      *ngIf="cartOpen"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
      (click)="closeCart()"
      data-testid="cart-overlay">
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `]
})
export class SimpleLayoutComponent {
  cartOpen = false;

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  closeCart(): void {
    this.cartOpen = false;
  }
}