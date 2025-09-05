import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CategoryService } from '../../../core/services/category.service';
import * as CategoryActions from './category.actions';

@Injectable()
export class CategoryEffects {
  
  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.loadCategories),
      switchMap(() =>
        this.categoryService.getCategories().pipe(
          map(categories => CategoryActions.loadCategoriesSuccess({ categories })),
          catchError(error => 
            of(CategoryActions.loadCategoriesFailure({ error: error.message || 'Failed to load categories' }))
          )
        )
      )
    )
  );

  loadCategoryHierarchy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.loadCategoryHierarchy),
      switchMap(() =>
        this.categoryService.getCategoryHierarchy().pipe(
          map(hierarchy => CategoryActions.loadCategoryHierarchySuccess({ hierarchy })),
          catchError(error => 
            of(CategoryActions.loadCategoryHierarchyFailure({ error: error.message || 'Failed to load category hierarchy' }))
          )
        )
      )
    )
  );

  loadCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.loadCategory),
      switchMap(({ id, slug }) => {
        const request = id ? 
          this.categoryService.getCategory(id) : 
          this.categoryService.getCategoryBySlug(slug!);
        
        return request.pipe(
          map(category => CategoryActions.loadCategorySuccess({ category })),
          catchError(error => 
            of(CategoryActions.loadCategoryFailure({ error: error.message || 'Failed to load category' }))
          )
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private categoryService: CategoryService
  ) {}
}