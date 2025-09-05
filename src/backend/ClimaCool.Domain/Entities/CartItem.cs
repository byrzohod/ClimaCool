using System;

namespace ClimaCool.Domain.Entities
{
    public class CartItem : CatalogBaseEntity
    {
        public int CartId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public int? ProductVariantId { get; set; }
        public string? VariantOptions { get; set; } // JSON string of selected options
        
        // Calculated properties
        public decimal Total => Price * Quantity;
        
        // Navigation properties
        public Cart Cart { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public ProductVariant? ProductVariant { get; set; }
    }
}