import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateOrderRequest, Order, Address } from '../models/checkout.models';

export const CheckoutActions = createActionGroup({
  source: 'Checkout',
  events: {
    // Order actions
    'Create Order': props<{ request: CreateOrderRequest }>(),
    'Create Order Success': props<{ order: Order }>(),
    'Create Order Failure': props<{ error: string }>(),

    'Load Order': props<{ orderId: string }>(),
    'Load Order Success': props<{ order: Order }>(),
    'Load Order Failure': props<{ error: string }>(),

    'Load Orders': emptyProps(),
    'Load Orders Success': props<{ orders: Order[] }>(),
    'Load Orders Failure': props<{ error: string }>(),

    // Address actions
    'Set Shipping Address': props<{ address: Address }>(),
    'Set Billing Address': props<{ address: Address }>(),
    'Set Same As Shipping': props<{ sameAsShipping: boolean }>(),
    'Set Order Notes': props<{ notes: string }>(),

    // Checkout flow actions
    'Set Current Step': props<{ step: number }>(),
    'Next Step': emptyProps(),
    'Previous Step': emptyProps(),
    'Reset Checkout': emptyProps(),

    // Validation actions
    'Set Shipping Valid': props<{ valid: boolean }>(),
    'Set Billing Valid': props<{ valid: boolean }>(),

    // Clear actions
    'Clear Error': emptyProps(),
    'Clear Current Order': emptyProps()
  }
});