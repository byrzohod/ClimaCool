import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () => import('./features/products/components/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/components/cart-page/cart-page.component').then(m => m.CartPageComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/components/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/components/orders-dashboard.component').then(m => m.OrdersDashboardComponent)
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./features/orders/components/order-details.component').then(m => m.OrderDetailsComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'auth/verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'admin/orders',
    loadComponent: () => import('./features/admin/orders/admin-orders.component').then(m => m.AdminOrdersComponent)
  },
  {
    path: 'admin/orders/:id',
    loadComponent: () => import('./features/admin/orders/admin-order-details.component').then(m => m.AdminOrderDetailsComponent)
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./features/admin/products/admin-products-list.component').then(m => m.AdminProductsListComponent)
  },
  {
    path: 'admin/products/new',
    loadComponent: () => import('./features/admin/products/admin-product-form.component').then(m => m.AdminProductFormComponent)
  },
  {
    path: 'admin/products/:id/edit',
    loadComponent: () => import('./features/admin/products/admin-product-form.component').then(m => m.AdminProductFormComponent)
  },
  {
    path: 'admin/inventory',
    loadComponent: () => import('./features/admin/products/admin-inventory.component').then(m => m.AdminInventoryComponent)
  },
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  }
];
