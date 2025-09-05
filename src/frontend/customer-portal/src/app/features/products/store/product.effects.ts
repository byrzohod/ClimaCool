import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product.service';
import * as ProductActions from './product.actions';

@Injectable()
export class ProductEffects {
  
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProducts),
      switchMap(({ filters }) =>
        this.productService.getProducts(filters).pipe(
          map(products => ProductActions.loadProductsSuccess({ products })),
          catchError(error => 
            of(ProductActions.loadProductsFailure({ error: error.message || 'Failed to load products' }))
          )
        )
      )
    )
  );

  loadProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProduct),
      switchMap(({ id, slug }) => {
        const request = id ? 
          this.productService.getProduct(id) : 
          this.productService.getProductBySlug(slug!);
        
        return request.pipe(
          map(product => ProductActions.loadProductSuccess({ product })),
          catchError(error => 
            of(ProductActions.loadProductFailure({ error: error.message || 'Failed to load product' }))
          )
        );
      })
    )
  );

  loadFeaturedProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadFeaturedProducts),
      switchMap(({ count = 10 }) =>
        this.productService.getFeaturedProducts(count).pipe(
          map(products => ProductActions.loadFeaturedProductsSuccess({ products })),
          catchError(error => 
            of(ProductActions.loadFeaturedProductsFailure({ error: error.message || 'Failed to load featured products' }))
          )
        )
      )
    )
  );

  loadRelatedProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadRelatedProducts),
      switchMap(({ productId, count = 6 }) =>
        this.productService.getRelatedProducts(productId, count).pipe(
          map(products => ProductActions.loadRelatedProductsSuccess({ products })),
          catchError(error => 
            of(ProductActions.loadRelatedProductsFailure({ error: error.message || 'Failed to load related products' }))
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private productService: ProductService
  ) {}
}