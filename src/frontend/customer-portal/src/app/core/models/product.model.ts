export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  categoryId: number;
  categoryName: string;
  brand?: string;
  model?: string;
  productType: ProductType;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  inStock: boolean;
  primaryImageUrl?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  averageRating?: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  brand?: string;
  primaryImageUrl?: string;
  inStock: boolean;
  isFeatured: boolean;
  averageRating?: number;
  reviewCount: number;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  attributes: ProductVariantAttribute[];
}

export interface ProductAttribute {
  name: string;
  value: string;
  unit?: string;
  displayOrder: number;
}

export interface ProductVariantAttribute {
  name: string;
  value: string;
}

export enum ProductType {
  AirConditioner = 'AirConditioner',
  SolarPanel = 'SolarPanel',
  HeatPump = 'HeatPump',
  Ventilation = 'Ventilation',
  Thermostat = 'Thermostat',
  Accessory = 'Accessory',
  Service = 'Service'
}

export interface ProductFilters {
  searchTerm?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}