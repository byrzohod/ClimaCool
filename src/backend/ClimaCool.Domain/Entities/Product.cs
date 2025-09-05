using System;
using System.Collections.Generic;

namespace ClimaCool.Domain.Entities
{
    public class Product : CatalogBaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ShortDescription { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public decimal CostPrice { get; set; }
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public ProductType ProductType { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; }
        public int StockQuantity { get; set; }
        public bool TrackInventory { get; set; } = true;
        public int? LowStockThreshold { get; set; }
        public decimal? Weight { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
        public ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();
        public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }
        public DateTime? PublishedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public enum ProductType
    {
        AirConditioner,
        SolarPanel,
        HeatPump,
        Ventilation,
        Thermostat,
        Accessory,
        Service
    }
}