using System;
using System.Collections.Generic;

namespace ClimaCool.Domain.Entities
{
    public class ProductVariant : CatalogBaseEntity
    {
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public decimal CostPrice { get; set; }
        public int StockQuantity { get; set; }
        public bool TrackInventory { get; set; } = true;
        public decimal? Weight { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<ProductVariantAttribute> Attributes { get; set; } = new List<ProductVariantAttribute>();
    }
}