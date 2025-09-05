using System;
using System.Collections.Generic;

namespace ClimaCool.Application.DTOs.Cart
{
    public class CartDto
    {
        public int Id { get; set; }
        public Guid? UserId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public List<CartItemDto> Items { get; set; } = new();
        public decimal SubTotal { get; set; }
        public int ItemCount { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime LastAccessedAt { get; set; }
    }

    public class CartItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSlug { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
        public int? ProductVariantId { get; set; }
        public string? VariantName { get; set; }
        public string? VariantOptions { get; set; }
        public int AvailableStock { get; set; }
    }

    public class AddToCartDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public int? ProductVariantId { get; set; }
        public string? VariantOptions { get; set; }
    }

    public class UpdateCartItemDto
    {
        public int Quantity { get; set; }
    }

    public class CartSummaryDto
    {
        public int ItemCount { get; set; }
        public decimal SubTotal { get; set; }
    }
}