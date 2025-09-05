import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as CartActions from '../../store/cart.actions';
import * as CartSelectors from '../../store/cart.selectors';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="toggleCart()"
      class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      [title]="'Shopping cart (' + (itemCount$ | async) + ' items)'"
      data-testid="cart-icon-button">
      
      <!-- Cart Icon -->
      <svg 
        class="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true">
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5M16 11v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4m10 0V7a4 4 0 00-8 0v4m8 0h-10">
        </path>
      </svg>

      <!-- Badge -->
      <span
        *ngIf="shouldShowBadge$ | async"
        class="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center animate-pulse"
        [class.animate-bounce]="recentlyAdded"
        data-testid="cart-badge">
        {{ badgeCount$ | async }}
      </span>

      <!-- Loading Indicator -->
      <div
        *ngIf="loading$ | async"
        class="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full animate-pulse">
      </div>
    </button>
  `,
  styles: [`
    .animate-bounce {
      animation: bounce 0.5s ease-in-out 2;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-4px);
      }
      60% {
        transform: translateY(-2px);
      }
    }
  `]
})
export class CartIconComponent implements OnInit {
  itemCount$: Observable<number>;
  badgeCount$: Observable<string>;
  shouldShowBadge$: Observable<boolean>;
  loading$: Observable<boolean>;
  recentlyAdded = false;

  private previousItemCount = 0;

  constructor(private store: Store) {
    this.itemCount$ = this.store.select(CartSelectors.selectCartSummaryItemCount);
    this.badgeCount$ = this.store.select(CartSelectors.selectCartBadgeCount);
    this.shouldShowBadge$ = this.store.select(CartSelectors.selectShouldShowCartBadge);
    this.loading$ = this.store.select(CartSelectors.selectCartLoading);
  }

  ngOnInit(): void {
    // Load cart summary on init
    this.store.dispatch(CartActions.loadCartSummary());
    
    // Watch for item count changes to trigger bounce animation
    this.itemCount$.subscribe(currentCount => {
      if (currentCount > this.previousItemCount && this.previousItemCount > 0) {
        this.recentlyAdded = true;
        setTimeout(() => {
          this.recentlyAdded = false;
        }, 1000);
      }
      this.previousItemCount = currentCount;
    });
  }

  toggleCart(): void {
    this.store.dispatch(CartActions.toggleCart());
  }
}