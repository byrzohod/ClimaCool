namespace ClimaCool.Application.DTOs.Product;

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string SKU { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? Cost { get; set; }
    public int QuantityInStock { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public Guid CategoryId { get; set; }
    public string? Brand { get; set; }
    public List<string>? Tags { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public List<ProductImageDto>? Images { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
}

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? Slug { get; set; }
    public string? SKU { get; set; }
    public decimal? Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? Cost { get; set; }
    public int? QuantityInStock { get; set; }
    public int? LowStockThreshold { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Brand { get; set; }
    public List<string>? Tags { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public List<ProductImageDto>? Images { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
}

public class BulkUpdateProductsDto
{
    public List<Guid> ProductIds { get; set; } = new();
    public Guid? CategoryId { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
    public decimal? PriceAdjustment { get; set; }
    public string? PriceAdjustmentType { get; set; } // "percentage" or "fixed"
    public int? StockAdjustment { get; set; }
    public List<string>? Tags { get; set; }
}

public class InventoryUpdateDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public string AdjustmentType { get; set; } = "set"; // "set", "add", "subtract"
    public string? Reason { get; set; }
}

public class ProductImageDto
{
    public string Url { get; set; } = string.Empty;
    public string? Alt { get; set; }
    public bool IsPrimary { get; set; }
    public int? DisplayOrder { get; set; }
}