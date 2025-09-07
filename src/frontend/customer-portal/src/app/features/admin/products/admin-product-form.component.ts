import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdminProductService, Product, CreateProductDto, UpdateProductDto, ProductImage } from './services/admin-product.service';
import { CategoryService } from '../../products/services/category.service';
import { Category } from '../../products/models/category.model';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <button 
              routerLink="/admin/products" 
              class="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to Products
            </button>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isEditMode ? 'Edit Product' : 'Create New Product' }}
            </h1>
          </div>
          <div class="flex space-x-3">
            <button 
              (click)="saveAsDraft()"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Save as Draft
            </button>
            <button 
              (click)="saveAndPublish()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ isEditMode ? 'Update Product' : 'Create Product' }}
            </button>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="productForm" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content (2 columns) -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Basic Information -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Basic Information</h2>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      formControlName="name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      [class.border-red-500]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
                    >
                    <p *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" 
                       class="mt-1 text-sm text-red-600">
                      Product name is required
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL)
                    </label>
                    <div class="flex">
                      <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        /products/
                      </span>
                      <input 
                        type="text"
                        formControlName="slug"
                        placeholder="auto-generated-from-name"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea 
                      formControlName="shortDescription"
                      rows="2"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief product description for listings..."
                    ></textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Full Description <span class="text-red-500">*</span>
                    </label>
                    <textarea 
                      formControlName="description"
                      rows="6"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      [class.border-red-500]="productForm.get('description')?.invalid && productForm.get('description')?.touched"
                      placeholder="Detailed product description..."
                    ></textarea>
                    <p *ngIf="productForm.get('description')?.invalid && productForm.get('description')?.touched" 
                       class="mt-1 text-sm text-red-600">
                      Description is required
                    </p>
                  </div>
                </div>
              </div>

              <!-- Pricing -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Pricing</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Price <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-gray-500">$</span>
                      <input 
                        type="number"
                        formControlName="price"
                        step="0.01"
                        min="0"
                        class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        [class.border-red-500]="productForm.get('price')?.invalid && productForm.get('price')?.touched"
                      >
                    </div>
                    <p *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched" 
                       class="mt-1 text-sm text-red-600">
                      Price is required and must be greater than 0
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Compare at Price
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-gray-500">$</span>
                      <input 
                        type="number"
                        formControlName="compareAtPrice"
                        step="0.01"
                        min="0"
                        class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Cost
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-gray-500">$</span>
                      <input 
                        type="number"
                        formControlName="cost"
                        step="0.01"
                        min="0"
                        class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inventory -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Inventory</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      SKU <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      formControlName="sku"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      [class.border-red-500]="productForm.get('sku')?.invalid && productForm.get('sku')?.touched"
                    >
                    <p *ngIf="productForm.get('sku')?.invalid && productForm.get('sku')?.touched" 
                       class="mt-1 text-sm text-red-600">
                      SKU is required
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      formControlName="quantityInStock"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      [class.border-red-500]="productForm.get('quantityInStock')?.invalid && productForm.get('quantityInStock')?.touched"
                    >
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input 
                      type="number"
                      formControlName="lowStockThreshold"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                  </div>
                </div>
              </div>

              <!-- Images -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Product Images</h2>
                
                <div class="space-y-4">
                  <!-- Image Upload Area -->
                  <div 
                    class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    (click)="fileInput.click()"
                    (drop)="onDrop($event)"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    [class.border-blue-500]="isDragging"
                  >
                    <input 
                      #fileInput
                      type="file"
                      accept="image/*"
                      multiple
                      (change)="onFilesSelected($event)"
                      class="hidden"
                    >
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p class="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>

                  <!-- Image Preview Grid -->
                  <div *ngIf="productImages.length > 0" class="grid grid-cols-4 gap-4">
                    <div *ngFor="let image of productImages; let i = index" class="relative group">
                      <img 
                        [src]="image.url" 
                        [alt]="image.alt"
                        class="w-full h-32 object-cover rounded-lg"
                      >
                      <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        <button 
                          type="button"
                          (click)="setPrimaryImage(i)"
                          [class.text-yellow-400]="image.isPrimary"
                          class="text-white hover:text-yellow-400 transition-colors"
                          title="Set as primary"
                        >
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </button>
                        <button 
                          type="button"
                          (click)="removeImage(i)"
                          class="text-white hover:text-red-400 transition-colors"
                          title="Remove image"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      <div *ngIf="image.isPrimary" class="absolute top-2 left-2 bg-yellow-400 text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SEO -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Search Engine Optimization</h2>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input 
                      type="text"
                      formControlName="metaTitle"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Page title for search engines"
                    >
                    <p class="mt-1 text-xs text-gray-500">
                      {{ (productForm.get('metaTitle')?.value || '').length }}/60 characters
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea 
                      formControlName="metaDescription"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description for search engine results"
                    ></textarea>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ (productForm.get('metaDescription')?.value || '').length }}/160 characters
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Meta Keywords
                    </label>
                    <input 
                      type="text"
                      formControlName="metaKeywords"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comma-separated keywords"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar (1 column) -->
            <div class="space-y-6">
              <!-- Status -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Status</h2>
                
                <div class="space-y-4">
                  <div>
                    <label class="flex items-center">
                      <input 
                        type="checkbox"
                        formControlName="isActive"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      >
                      <span class="text-sm font-medium text-gray-700">Active</span>
                    </label>
                    <p class="ml-6 text-xs text-gray-500">Product is visible to customers</p>
                  </div>

                  <div>
                    <label class="flex items-center">
                      <input 
                        type="checkbox"
                        formControlName="isFeatured"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      >
                      <span class="text-sm font-medium text-gray-700">Featured</span>
                    </label>
                    <p class="ml-6 text-xs text-gray-500">Show in featured sections</p>
                  </div>
                </div>
              </div>

              <!-- Organization -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Organization</h2>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Category <span class="text-red-500">*</span>
                    </label>
                    <select 
                      formControlName="categoryId"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      [class.border-red-500]="productForm.get('categoryId')?.invalid && productForm.get('categoryId')?.touched"
                    >
                      <option value="">Select a category</option>
                      <option *ngFor="let category of categories" [value]="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <p *ngIf="productForm.get('categoryId')?.invalid && productForm.get('categoryId')?.touched" 
                       class="mt-1 text-sm text-red-600">
                      Category is required
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input 
                      type="text"
                      formControlName="brand"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div class="space-y-2">
                      <div class="flex flex-wrap gap-2">
                        <span *ngFor="let tag of tags; let i = index" 
                              class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          {{ tag }}
                          <button 
                            type="button"
                            (click)="removeTag(i)"
                            class="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                      <input 
                        type="text"
                        [(ngModel)]="newTag"
                        [ngModelOptions]="{standalone: true}"
                        (keyup.enter)="addTag()"
                        placeholder="Add a tag and press Enter"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Shipping</h2>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Weight (lbs)
                    </label>
                    <input 
                      type="number"
                      formControlName="weight"
                      step="0.01"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Dimensions (L x W x H)
                    </label>
                    <input 
                      type="text"
                      formControlName="dimensions"
                      placeholder="12 x 8 x 4 inches"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class AdminProductFormComponent implements OnInit {
  productForm!: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  categories: Category[] = [];
  productImages: ProductImage[] = [];
  tags: string[] = [];
  newTag = '';
  isDragging = false;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private productService: AdminProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadCategories();
    
    // Check if we're in edit mode or duplicating
    this.productId = this.route.snapshot.params['id'];
    const duplicateId = this.route.snapshot.queryParams['duplicate'];
    
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    } else if (duplicateId) {
      this.loadProductForDuplication(duplicateId);
    }
  }

  initializeForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      slug: [''],
      description: ['', [Validators.required]],
      shortDescription: [''],
      sku: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      compareAtPrice: [null],
      cost: [null],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [10],
      categoryId: ['', [Validators.required]],
      brand: [''],
      weight: [null],
      dimensions: [''],
      isActive: [true],
      isFeatured: [false],
      metaTitle: [''],
      metaDescription: [''],
      metaKeywords: ['']
    });

    // Auto-generate slug from name
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.isEditMode && name) {
        const slug = this.generateSlug(name);
        this.productForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadProduct(id: string) {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          sku: product.sku,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          cost: product.cost,
          quantityInStock: product.quantityInStock,
          lowStockThreshold: product.lowStockThreshold,
          categoryId: product.categoryId,
          brand: product.brand,
          weight: product.weight,
          dimensions: product.dimensions,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          metaKeywords: product.metaKeywords
        });
        
        this.productImages = product.images || [];
        this.tags = product.tags || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = 'Failed to load product';
        this.loading = false;
      }
    });
  }

  loadProductForDuplication(id: string) {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        // Load product data but clear unique fields
        this.productForm.patchValue({
          name: `${product.name} (Copy)`,
          slug: '',
          description: product.description,
          shortDescription: product.shortDescription,
          sku: `${product.sku}-COPY`,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          cost: product.cost,
          quantityInStock: product.quantityInStock,
          lowStockThreshold: product.lowStockThreshold,
          categoryId: product.categoryId,
          brand: product.brand,
          weight: product.weight,
          dimensions: product.dimensions,
          isActive: false, // Start as inactive
          isFeatured: false,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          metaKeywords: product.metaKeywords
        });
        
        this.tags = product.tags || [];
      },
      error: (err) => {
        console.error('Error loading product for duplication:', err);
      }
    });
  }

  saveAsDraft() {
    this.productForm.patchValue({ isActive: false });
    this.saveProduct();
  }

  saveAndPublish() {
    this.productForm.patchValue({ isActive: true });
    this.saveProduct();
  }

  saveProduct() {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formValue = this.productForm.value;
    const productData = {
      ...formValue,
      tags: this.tags,
      images: this.productImages
    };

    if (this.isEditMode && this.productId) {
      this.updateProduct(this.productId, productData);
    } else {
      this.createProduct(productData);
    }
  }

  createProduct(data: CreateProductDto) {
    this.loading = true;
    this.productService.createProduct(data).subscribe({
      next: (product) => {
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        console.error('Error creating product:', err);
        this.error = 'Failed to create product';
        this.loading = false;
      }
    });
  }

  updateProduct(id: string, data: UpdateProductDto) {
    this.loading = true;
    this.productService.updateProduct(id, data).subscribe({
      next: (product) => {
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        console.error('Error updating product:', err);
        this.error = 'Failed to update product';
        this.loading = false;
      }
    });
  }

  // Image handling
  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  handleFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        this.uploadImage(file);
      }
    }
  }

  uploadImage(file: File) {
    // In a real app, upload to server first
    // For now, create a local URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.productImages.push({
        url: e.target.result,
        alt: this.productForm.get('name')?.value || 'Product image',
        isPrimary: this.productImages.length === 0,
        displayOrder: this.productImages.length
      });
    };
    reader.readAsDataURL(file);
  }

  setPrimaryImage(index: number) {
    this.productImages.forEach((img, i) => {
      img.isPrimary = i === index;
    });
  }

  removeImage(index: number) {
    this.productImages.splice(index, 1);
    // Set first image as primary if we removed the primary one
    if (this.productImages.length > 0 && !this.productImages.some(img => img.isPrimary)) {
      this.productImages[0].isPrimary = true;
    }
  }

  // Tag handling
  addTag() {
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}