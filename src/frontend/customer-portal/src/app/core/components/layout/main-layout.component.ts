import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import { CartIconComponent } from '../../../features/cart/components/cart-icon/cart-icon.component';
import { CartSidebarComponent } from '../../../features/cart/components/cart-sidebar/cart-sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    RouterOutlet,
    CartIconComponent,
    CartSidebarComponent
  ],
  template: `
    <!-- Header -->
    <header class="bg-white shadow-md sticky top-0 z-40" data-testid="main-header">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center space-x-2" data-testid="logo-link">
              <div class="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-900">ClimaCool</span>
            </a>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8" data-testid="main-navigation">
            <a routerLink="/products" 
               routerLinkActive="text-blue-600 border-b-2 border-blue-600"
               [routerLinkActiveOptions]="{exact: false}"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">
              Products
            </a>
            <a routerLink="/categories" 
               routerLinkActive="text-blue-600 border-b-2 border-blue-600"
               [routerLinkActiveOptions]="{exact: false}"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">
              Categories
            </a>
            <a routerLink="/about" 
               routerLinkActive="text-blue-600 border-b-2 border-blue-600"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">
              About
            </a>
            <a routerLink="/contact" 
               routerLinkActive="text-blue-600 border-b-2 border-blue-600"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors">
              Contact
            </a>
          </nav>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-4">
            
            <!-- Search (placeholder) -->
            <button class="text-gray-500 hover:text-gray-700 p-2 transition-colors" title="Search">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>

            <!-- User Menu (placeholder) -->
            <button class="text-gray-500 hover:text-gray-700 p-2 transition-colors" title="Account">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>

            <!-- Cart Icon -->
            <app-cart-icon></app-cart-icon>

            <!-- Mobile Menu Button -->
            <button 
              class="md:hidden text-gray-500 hover:text-gray-700 p-2 transition-colors"
              (click)="toggleMobileMenu()"
              data-testid="mobile-menu-button">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div 
          *ngIf="mobileMenuOpen"
          class="md:hidden border-t border-gray-200 py-4"
          data-testid="mobile-navigation">
          <div class="flex flex-col space-y-2">
            <a routerLink="/products" 
               (click)="closeMobileMenu()"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Products
            </a>
            <a routerLink="/categories" 
               (click)="closeMobileMenu()"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Categories
            </a>
            <a routerLink="/about" 
               (click)="closeMobileMenu()"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              About
            </a>
            <a routerLink="/contact" 
               (click)="closeMobileMenu()"
               class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Contact
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8" data-testid="main-footer">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <!-- Company Info -->
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span class="text-lg font-bold">ClimaCool</span>
            </div>
            <p class="text-gray-300 text-sm">
              Your trusted partner for HVAC solutions. Quality air conditioners, solar systems, and climate control equipment.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-white font-semibold mb-4">Quick Links</h3>
            <ul class="space-y-2">
              <li><a routerLink="/products" class="text-gray-300 hover:text-white text-sm transition-colors">Products</a></li>
              <li><a routerLink="/categories" class="text-gray-300 hover:text-white text-sm transition-colors">Categories</a></li>
              <li><a routerLink="/about" class="text-gray-300 hover:text-white text-sm transition-colors">About Us</a></li>
              <li><a routerLink="/contact" class="text-gray-300 hover:text-white text-sm transition-colors">Contact</a></li>
            </ul>
          </div>

          <!-- Customer Service -->
          <div>
            <h3 class="text-white font-semibold mb-4">Customer Service</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-300 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white text-sm transition-colors">Returns</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white text-sm transition-colors">Shipping Info</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white text-sm transition-colors">Warranty</a></li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div>
            <h3 class="text-white font-semibold mb-4">Contact Us</h3>
            <div class="space-y-2 text-sm text-gray-300">
              <p>📧 support@climacool.com</p>
              <p>📞 1-800-CLIMA-COOL</p>
              <p>📍 123 Climate St, Cool City, CC 12345</p>
            </div>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-gray-700 mt-8 pt-8 text-center">
          <p class="text-gray-400 text-sm">
            © {{ currentYear }} ClimaCool. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

    <!-- Cart Sidebar -->
    <app-cart-sidebar></app-cart-sidebar>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `]
})
export class MainLayoutComponent {
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  constructor(private store: Store) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}