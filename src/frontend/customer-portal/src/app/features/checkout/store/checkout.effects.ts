import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, withLatestFrom } from 'rxjs/operators';

import { CheckoutActions } from './checkout.actions';
import { CheckoutService } from '../services/checkout.service';
import * as CheckoutSelectors from './checkout.selectors';
import { CreateOrderRequest } from '../models/checkout.models';

@Injectable()
export class CheckoutEffects {

  createOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CheckoutActions.createOrder),
      exhaustMap(({ request }) =>
        this.checkoutService.createOrder(request).pipe(
          map(order => CheckoutActions.createOrderSuccess({ order })),
          catchError(error => 
            of(CheckoutActions.createOrderFailure({ 
              error: error.error?.message || 'Failed to create order. Please try again.' 
            }))
          )
        )
      )
    )
  );

  loadOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CheckoutActions.loadOrder),
      exhaustMap(({ orderId }) =>
        this.checkoutService.getOrder(orderId).pipe(
          map(order => CheckoutActions.loadOrderSuccess({ order })),
          catchError(error =>
            of(CheckoutActions.loadOrderFailure({
              error: error.error?.message || 'Failed to load order details.'
            }))
          )
        )
      )
    )
  );

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CheckoutActions.loadOrders),
      exhaustMap(() =>
        this.checkoutService.getUserOrders().pipe(
          map(orders => CheckoutActions.loadOrdersSuccess({ orders })),
          catchError(error =>
            of(CheckoutActions.loadOrdersFailure({
              error: error.error?.message || 'Failed to load orders.'
            }))
          )
        )
      )
    )
  );

  // Effect to handle order creation with current checkout data
  createOrderFromCheckout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CheckoutActions.createOrder),
      withLatestFrom(
        this.store.select(CheckoutSelectors.selectShippingAddress),
        this.store.select(CheckoutSelectors.selectBillingAddress),
        this.store.select(CheckoutSelectors.selectSameAsShipping),
        this.store.select(CheckoutSelectors.selectOrderNotes)
      ),
      map(([action, shippingAddress, billingAddress, sameAsShipping, notes]) => {
        // If we have the data in store, use it instead of the action payload
        if (shippingAddress && (billingAddress || sameAsShipping)) {
          const finalBillingAddress = sameAsShipping 
            ? { ...shippingAddress, type: 'billing' as any }
            : billingAddress!;

          const request: CreateOrderRequest = {
            shippingAddress,
            billingAddress: finalBillingAddress,
            notes: notes || undefined
          };

          return CheckoutActions.createOrder({ request });
        }
        
        // Otherwise use the original action
        return action;
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private checkoutService: CheckoutService
  ) {}
}