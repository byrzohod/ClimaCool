using System;

namespace ClimaCool.Domain.Entities
{
    public class ProductAttribute : CatalogBaseEntity
    {
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsSearchable { get; set; }
        public bool ShowInSpecs { get; set; } = true;
    }
}