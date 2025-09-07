using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Interfaces;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text;
using CsvHelper;
using System.Globalization;
using CsvHelper.Configuration;

namespace ClimaCool.Application.Services;

public class AdminProductService : IAdminProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IImageUploadService _imageUploadService;
    private readonly ILogger<AdminProductService> _logger;

    public AdminProductService(
        IUnitOfWork unitOfWork,
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IImageUploadService imageUploadService,
        ILogger<AdminProductService> logger)
    {
        _unitOfWork = unitOfWork;
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _imageUploadService = imageUploadService;
        _logger = logger;
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
    {
        // Validate category exists
        var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
        if (category == null)
        {
            throw new ArgumentException($"Category with ID {dto.CategoryId} not found");
        }

        // Generate slug if not provided
        var slug = string.IsNullOrEmpty(dto.Slug) 
            ? GenerateSlug(dto.Name) 
            : dto.Slug;

        // Ensure slug is unique
        var existingProduct = await _productRepository.GetBySlugAsync(slug);
        if (existingProduct != null)
        {
            throw new ArgumentException($"Product with slug '{slug}' already exists");
        }

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            Slug = slug,
            SKU = dto.SKU,
            Price = dto.Price,
            CompareAtPrice = dto.CompareAtPrice,
            CostPrice = dto.Cost ?? 0,
            StockQuantity = dto.QuantityInStock,
            LowStockThreshold = dto.LowStockThreshold,
            CategoryId = dto.CategoryId,
            Brand = dto.Brand,
            Weight = dto.Weight,
            IsActive = dto.IsActive,
            IsFeatured = dto.IsFeatured,
            MetaTitle = dto.MetaTitle ?? dto.Name,
            MetaDescription = dto.MetaDescription ?? dto.ShortDescription,
            MetaKeywords = dto.MetaKeywords,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _productRepository.AddAsync(product);
        await _unitOfWork.CompleteAsync();

        // Handle images if provided
        if (dto.Images != null && dto.Images.Any())
        {
            await UpdateProductImagesAsync(product.Id, dto.Images);
        }

        return MapToDto(product);
    }

    public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID {id} not found");
        }

        // Validate category if changed
        if (dto.CategoryId.HasValue && dto.CategoryId.Value != product.CategoryId)
        {
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId.Value);
            if (category == null)
            {
                throw new ArgumentException($"Category with ID {dto.CategoryId} not found");
            }
            product.CategoryId = dto.CategoryId.Value;
        }

        // Update slug if name changed
        if (!string.IsNullOrEmpty(dto.Name) && dto.Name != product.Name)
        {
            product.Name = dto.Name;
            if (string.IsNullOrEmpty(dto.Slug))
            {
                product.Slug = GenerateSlug(dto.Name);
            }
        }

        if (!string.IsNullOrEmpty(dto.Slug) && dto.Slug != product.Slug)
        {
            // Ensure new slug is unique
            var existingProduct = await _productRepository.GetBySlugAsync(dto.Slug);
            if (existingProduct != null && existingProduct.Id != id)
            {
                throw new ArgumentException($"Product with slug '{dto.Slug}' already exists");
            }
            product.Slug = dto.Slug;
        }

        // Update other fields
        if (!string.IsNullOrEmpty(dto.Description)) product.Description = dto.Description;
        if (!string.IsNullOrEmpty(dto.ShortDescription)) product.ShortDescription = dto.ShortDescription;
        if (!string.IsNullOrEmpty(dto.SKU)) product.SKU = dto.SKU;
        if (dto.Price.HasValue) product.Price = dto.Price.Value;
        if (dto.CompareAtPrice.HasValue) product.CompareAtPrice = dto.CompareAtPrice;
        if (dto.Cost.HasValue) product.CostPrice = dto.Cost.Value;
        if (dto.QuantityInStock.HasValue) product.StockQuantity = dto.QuantityInStock.Value;
        if (dto.LowStockThreshold.HasValue) product.LowStockThreshold = dto.LowStockThreshold.Value;
        if (!string.IsNullOrEmpty(dto.Brand)) product.Brand = dto.Brand;
        if (dto.Weight.HasValue) product.Weight = dto.Weight;
        if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;
        if (dto.IsFeatured.HasValue) product.IsFeatured = dto.IsFeatured.Value;
        if (!string.IsNullOrEmpty(dto.MetaTitle)) product.MetaTitle = dto.MetaTitle;
        if (!string.IsNullOrEmpty(dto.MetaDescription)) product.MetaDescription = dto.MetaDescription;
        if (!string.IsNullOrEmpty(dto.MetaKeywords)) product.MetaKeywords = dto.MetaKeywords;

        product.UpdatedAt = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product);
        await _unitOfWork.CompleteAsync();

        // Handle images if provided
        if (dto.Images != null)
        {
            await UpdateProductImagesAsync(product.Id, dto.Images);
        }

        return MapToDto(product);
    }

    public async Task<bool> DeleteProductAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            return false;
        }

        // Soft delete
        product.IsActive = false;
        product.DeletedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product);
        await _unitOfWork.CompleteAsync();

        return true;
    }

    public async Task<BulkOperationResult> BulkUpdateProductsAsync(BulkUpdateProductsDto dto)
    {
        var result = new BulkOperationResult
        {
            TotalItems = dto.ProductIds.Count,
            SuccessCount = 0,
            FailureCount = 0,
            Errors = new List<string>()
        };

        foreach (var productId in dto.ProductIds)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(productId);
                if (product == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Product {productId} not found");
                    continue;
                }

                // Apply bulk updates
                if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId.Value;
                if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;
                if (dto.IsFeatured.HasValue) product.IsFeatured = dto.IsFeatured.Value;
                if (dto.PriceAdjustment.HasValue)
                {
                    if (dto.PriceAdjustmentType == "percentage")
                    {
                        product.Price *= (1 + dto.PriceAdjustment.Value / 100);
                    }
                    else
                    {
                        product.Price += dto.PriceAdjustment.Value;
                    }
                    product.Price = Math.Max(0, product.Price); // Ensure price doesn't go negative
                }
                if (dto.StockAdjustment.HasValue)
                {
                    product.StockQuantity += dto.StockAdjustment.Value;
                    product.StockQuantity = Math.Max(0, product.StockQuantity); // Ensure stock doesn't go negative
                }
                // Tags functionality removed - not in domain model

                product.UpdatedAt = DateTime.UtcNow;
                await _productRepository.UpdateAsync(product);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Error updating product {productId}: {ex.Message}");
                _logger.LogError(ex, "Error during bulk update for product {ProductId}", productId);
            }
        }

        await _unitOfWork.CompleteAsync();
        return result;
    }

    public async Task<BulkOperationResult> BulkDeleteProductsAsync(List<int> productIds)
    {
        var result = new BulkOperationResult
        {
            TotalItems = productIds.Count,
            SuccessCount = 0,
            FailureCount = 0,
            Errors = new List<string>()
        };

        foreach (var productId in productIds)
        {
            try
            {
                var deleted = await DeleteProductAsync(productId);
                if (deleted)
                {
                    result.SuccessCount++;
                }
                else
                {
                    result.FailureCount++;
                    result.Errors.Add($"Product {productId} not found");
                }
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Error deleting product {productId}: {ex.Message}");
                _logger.LogError(ex, "Error during bulk delete for product {ProductId}", productId);
            }
        }

        return result;
    }

    public async Task<string> UploadProductImageAsync(int productId, IFormFile file)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID {productId} not found");
        }

        // Upload image
        var imageUrl = await _imageUploadService.UploadImageAsync(file, $"products/{productId}");

        // Add to product images
        product.Images = product.Images ?? new List<ProductImage>();
        product.Images.Add(new ProductImage
        {
            ImageUrl = imageUrl,
            AltText = product.Name,
            IsPrimary = !product.Images.Any(), // First image is primary
            DisplayOrder = product.Images.Count
        });

        product.UpdatedAt = DateTime.UtcNow;
        await _productRepository.UpdateAsync(product);
        await _unitOfWork.CompleteAsync();

        return imageUrl;
    }

    public async Task<bool> DeleteProductImageAsync(int productId, string imageUrl)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID {productId} not found");
        }

        if (product.Images == null || !product.Images.Any())
        {
            return false;
        }

        var image = product.Images.FirstOrDefault(i => i.ImageUrl == imageUrl);
        if (image == null)
        {
            return false;
        }

        // Delete from storage
        await _imageUploadService.DeleteImageAsync(imageUrl);

        // Remove from product
        product.Images.Remove(image);

        // If deleted image was primary, make the first remaining image primary
        if (image.IsPrimary && product.Images.Any())
        {
            product.Images.First().IsPrimary = true;
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _productRepository.UpdateAsync(product);
        await _unitOfWork.CompleteAsync();

        return true;
    }

    public async Task<ImportResult> ImportProductsFromCsvAsync(IFormFile file)
    {
        var result = new ImportResult
        {
            TotalRows = 0,
            SuccessCount = 0,
            FailureCount = 0,
            Errors = new List<string>()
        };

        using var reader = new StreamReader(file.OpenReadStream());
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

        var records = csv.GetRecords<ProductImportDto>().ToList();
        result.TotalRows = records.Count;

        foreach (var record in records)
        {
            try
            {
                // Validate and get category
                var category = await _categoryRepository.GetBySlugAsync(record.CategorySlug);
                if (category == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {result.TotalRows - records.Count + records.IndexOf(record) + 2}: Category '{record.CategorySlug}' not found");
                    continue;
                }

                // Check if product exists (update) or create new
                // Check if product with SKU exists
                var existingProducts = await _productRepository.FindAsync(p => p.SKU == record.SKU);
                var product = existingProducts.FirstOrDefault();
                
                if (product != null)
                {
                    // Update existing product
                    var updateDto = new UpdateProductDto
                    {
                        Name = record.Name,
                        Description = record.Description,
                        ShortDescription = record.ShortDescription,
                        Price = record.Price,
                        CompareAtPrice = record.CompareAtPrice,
                        Cost = record.Cost,
                        QuantityInStock = record.QuantityInStock,
                        CategoryId = category.Id,
                        Brand = record.Brand,
                        IsActive = record.IsActive ?? true,
                        IsFeatured = record.IsFeatured ?? false
                    };
                    await UpdateProductAsync(product.Id, updateDto);
                }
                else
                {
                    // Create new product
                    var createDto = new CreateProductDto
                    {
                        Name = record.Name,
                        Description = record.Description,
                        ShortDescription = record.ShortDescription,
                        SKU = record.SKU,
                        Price = record.Price,
                        CompareAtPrice = record.CompareAtPrice,
                        Cost = record.Cost,
                        QuantityInStock = record.QuantityInStock,
                        CategoryId = category.Id,
                        Brand = record.Brand,
                        IsActive = record.IsActive ?? true,
                        IsFeatured = record.IsFeatured ?? false
                    };
                    await CreateProductAsync(createDto);
                }

                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Row {result.TotalRows - records.Count + records.IndexOf(record) + 2}: {ex.Message}");
                _logger.LogError(ex, "Error importing product with SKU {SKU}", record.SKU);
            }
        }

        return result;
    }

    public async Task<byte[]> ExportProductsToCsvAsync(ProductFilterRequest filter)
    {
        // Get paged products for export
        var (products, totalCount) = await _productRepository.GetPagedAsync(
            filter: null,
            orderBy: null,
            pageIndex: filter.PageNumber,
            pageSize: filter.PageSize,
            includeDetails: true);
        
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        var exportData = products.Select(p => new ProductExportDto
        {
            SKU = p.SKU,
            Name = p.Name,
            Description = p.Description,
            ShortDescription = p.ShortDescription,
            CategoryName = p.Category?.Name,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            Cost = p.CostPrice,
            QuantityInStock = p.StockQuantity,
            Brand = p.Brand,
            IsActive = p.IsActive,
            IsFeatured = p.IsFeatured,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        });

        csv.WriteRecords(exportData);
        writer.Flush();

        return memoryStream.ToArray();
    }

    public async Task<InventoryUpdateResult> UpdateInventoryAsync(List<InventoryUpdateDto> updates)
    {
        var result = new InventoryUpdateResult
        {
            TotalItems = updates.Count,
            SuccessCount = 0,
            FailureCount = 0,
            Errors = new List<string>()
        };

        foreach (var update in updates)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(update.ProductId);
                if (product == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Product {update.ProductId} not found");
                    continue;
                }

                switch (update.AdjustmentType)
                {
                    case "set":
                        product.StockQuantity = update.Quantity;
                        break;
                    case "add":
                        product.StockQuantity += update.Quantity;
                        break;
                    case "subtract":
                        product.StockQuantity = Math.Max(0, product.StockQuantity - update.Quantity);
                        break;
                }

                product.UpdatedAt = DateTime.UtcNow;
                await _productRepository.UpdateAsync(product);
                result.SuccessCount++;

                // Check low stock threshold
                if (product.LowStockThreshold.HasValue && product.StockQuantity <= product.LowStockThreshold.Value)
                {
                    _logger.LogWarning("Product {ProductId} ({SKU}) is low on stock: {Quantity} remaining", 
                        product.Id, product.SKU, product.StockQuantity);
                }
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Error updating inventory for product {update.ProductId}: {ex.Message}");
                _logger.LogError(ex, "Error updating inventory for product {ProductId}", update.ProductId);
            }
        }

        await _unitOfWork.CompleteAsync();
        return result;
    }

    private async Task UpdateProductImagesAsync(int productId, List<ProductImageDto> images)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null) return;

        product.Images = images.Select((img, index) => new ProductImage
        {
            ImageUrl = img.Url,
            AltText = img.Alt ?? product.Name,
            IsPrimary = img.IsPrimary,
            DisplayOrder = img.DisplayOrder ?? index
        }).ToList();

        // Ensure exactly one primary image
        if (!product.Images.Any(i => i.IsPrimary) && product.Images.Any())
        {
            product.Images.First().IsPrimary = true;
        }

        await _productRepository.UpdateAsync(product);
    }

    private string GenerateSlug(string name)
    {
        // Simple slug generation - can be enhanced
        return name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("!", "")
            .Replace("?", "")
            .Replace("/", "-")
            .Replace("\\", "-");
    }

    private ProductDto MapToDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            ShortDescription = product.ShortDescription,
            Slug = product.Slug,
            SKU = product.SKU,
            Price = product.Price,
            CompareAtPrice = product.CompareAtPrice,
            StockQuantity = product.StockQuantity,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            Brand = product.Brand,
            Images = product.Images?.Select(i => new ProductImageDto
            {
                Url = i.ImageUrl,
                Alt = i.AltText,
                IsPrimary = i.IsPrimary,
                DisplayOrder = i.DisplayOrder
            }).ToList(),
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }
}

public class BulkOperationResult
{
    public int TotalItems { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

public class ImportResult : BulkOperationResult
{
    public int TotalRows { get; set; }
}

public class InventoryUpdateResult : BulkOperationResult
{
}

public class ProductImportDto
{
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? Cost { get; set; }
    public int QuantityInStock { get; set; }
    public string? Brand { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
}

public class ProductExportDto
{
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? Cost { get; set; }
    public int QuantityInStock { get; set; }
    public string? Brand { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}