import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.state';

export const selectCartState = createFeatureSelector<CartState>('cart');

// Cart Selectors
export const selectCart = createSelector(
  selectCartState,
  (state: CartState) => state.cart
);

export const selectCartItems = createSelector(
  selectCart,
  (cart) => cart?.items || []
);

export const selectCartItemCount = createSelector(
  selectCart,
  (cart) => cart?.itemCount || 0
);

export const selectCartSubTotal = createSelector(
  selectCart,
  (cart) => cart?.subTotal || 0
);

export const selectCartIsEmpty = createSelector(
  selectCartItems,
  (items) => items.length === 0
);

// Cart Summary Selectors
export const selectCartSummary = createSelector(
  selectCartState,
  (state: CartState) => state.summary
);

export const selectCartSummaryItemCount = createSelector(
  selectCartSummary,
  (summary) => summary?.itemCount || 0
);

export const selectCartSummarySubTotal = createSelector(
  selectCartSummary,
  (summary) => summary?.subTotal || 0
);

// Loading and Error Selectors
export const selectCartLoading = createSelector(
  selectCartState,
  (state: CartState) => state.loading
);

export const selectCartError = createSelector(
  selectCartState,
  (state: CartState) => state.error
);

// UI Selectors
export const selectCartOpen = createSelector(
  selectCartState,
  (state: CartState) => state.cartOpen
);

// Item-specific Selectors
export const selectCartItemById = (productId: number) => createSelector(
  selectCartItems,
  (items) => items.find(item => item.productId === productId)
);

export const selectCartItemQuantity = (productId: number) => createSelector(
  selectCartItemById(productId),
  (item) => item?.quantity || 0
);

// Computed Selectors
export const selectCartWithComputedValues = createSelector(
  selectCart,
  selectCartItems,
  (cart, items) => {
    if (!cart) return null;
    
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    
    return {
      ...cart,
      itemCount,
      subTotal
    };
  }
);

// Cart validation selectors
export const selectHasCartItems = createSelector(
  selectCartItemCount,
  (itemCount) => itemCount > 0
);

export const selectCartHasErrors = createSelector(
  selectCartError,
  (error) => error !== null
);

// Badge display selector
export const selectCartBadgeCount = createSelector(
  selectCartSummaryItemCount,
  (itemCount) => itemCount > 99 ? '99+' : itemCount.toString()
);

export const selectShouldShowCartBadge = createSelector(
  selectCartSummaryItemCount,
  (itemCount) => itemCount > 0
);