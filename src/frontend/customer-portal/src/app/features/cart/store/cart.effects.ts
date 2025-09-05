import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import * as CartActions from './cart.actions';

@Injectable()
export class CartEffects {

  constructor(
    private actions$: Actions,
    private cartService: CartService
  ) {}

  // Load Cart
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      exhaustMap(() =>
        this.cartService.getCart().pipe(
          map(cart => CartActions.loadCartSuccess({ cart })),
          catchError(error => of(CartActions.loadCartFailure({ 
            error: error.error?.message || 'Failed to load cart' 
          })))
        )
      )
    )
  );

  // Load Cart Summary
  loadCartSummary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCartSummary),
      exhaustMap(() =>
        this.cartService.getCartSummary().pipe(
          map(summary => CartActions.loadCartSummarySuccess({ summary })),
          catchError(error => of(CartActions.loadCartSummaryFailure({ 
            error: error.error?.message || 'Failed to load cart summary' 
          })))
        )
      )
    )
  );

  // Add to Cart
  addToCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addToCart),
      exhaustMap(({ item }) =>
        this.cartService.addToCart(item).pipe(
          map(cart => CartActions.addToCartSuccess({ cart })),
          catchError(error => of(CartActions.addToCartFailure({ 
            error: error.error?.message || 'Failed to add item to cart' 
          })))
        )
      )
    )
  );

  // Update Cart Item
  updateCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateCartItem),
      exhaustMap(({ productId, update }) =>
        this.cartService.updateCartItem(productId, update).pipe(
          map(cart => CartActions.updateCartItemSuccess({ cart })),
          catchError(error => of(CartActions.updateCartItemFailure({ 
            error: error.error?.message || 'Failed to update cart item' 
          })))
        )
      )
    )
  );

  // Remove from Cart
  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeFromCart),
      exhaustMap(({ productId }) =>
        this.cartService.removeFromCart(productId).pipe(
          map(cart => CartActions.removeFromCartSuccess({ cart })),
          catchError(error => of(CartActions.removeFromCartFailure({ 
            error: error.error?.message || 'Failed to remove item from cart' 
          })))
        )
      )
    )
  );

  // Clear Cart
  clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCart),
      exhaustMap(() =>
        this.cartService.clearCart().pipe(
          map(cart => CartActions.clearCartSuccess({ cart })),
          catchError(error => of(CartActions.clearCartFailure({ 
            error: error.error?.message || 'Failed to clear cart' 
          })))
        )
      )
    )
  );

  // Merge Carts
  mergeCarts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.mergeCarts),
      exhaustMap(() =>
        this.cartService.mergeCarts().pipe(
          map(result => CartActions.mergeCartsSuccess({ merged: result.merged })),
          catchError(error => of(CartActions.mergeCartsFailure({ 
            error: error.error?.message || 'Failed to merge carts' 
          })))
        )
      )
    )
  );

  // Reload cart after successful merge
  mergeCartsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.mergeCartsSuccess),
      map(() => CartActions.loadCart())
    )
  );

  // Load cart summary after cart operations
  loadCartSummaryAfterCartChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CartActions.addToCartSuccess,
        CartActions.updateCartItemSuccess,
        CartActions.removeFromCartSuccess,
        CartActions.clearCartSuccess
      ),
      map(() => CartActions.loadCartSummary())
    )
  );
}