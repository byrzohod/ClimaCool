using System;

namespace ClimaCool.Domain.Entities
{
    public class ProductVariantAttribute : CatalogBaseEntity
    {
        public int ProductVariantId { get; set; }
        public ProductVariant ProductVariant { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}