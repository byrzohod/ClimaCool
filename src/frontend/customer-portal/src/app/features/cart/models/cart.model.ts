export interface Cart {
  id: number;
  userId?: string;
  sessionId: string;
  items: CartItem[];
  subTotal: number;
  itemCount: number;
  expiresAt: Date;
  lastAccessedAt: Date;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImageUrl?: string;
  quantity: number;
  price: number;
  total: number;
  productVariantId?: number;
  variantName?: string;
  variantOptions?: string;
  availableStock: number;
}

export interface AddToCart {
  productId: number;
  quantity: number;
  productVariantId?: number;
  variantOptions?: string;
}

export interface UpdateCartItem {
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  subTotal: number;
}