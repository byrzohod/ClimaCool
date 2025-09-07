using ClimaCool.Application.DTOs.Product;
using ClimaCool.Application.Interfaces;
using ClimaCool.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClimaCool.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
public class AdminProductController : ControllerBase
{
    private readonly IAdminProductService _adminProductService;
    private readonly IProductService _productService;
    private readonly ILogger<AdminProductController> _logger;

    public AdminProductController(
        IAdminProductService adminProductService,
        IProductService productService,
        ILogger<AdminProductController> logger)
    {
        _adminProductService = adminProductService;
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Get all products with admin details
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts([FromQuery] ProductFilterRequest filter)
    {
        var products = await _productService.GetProductsAsync(filter);
        return Ok(products);
    }

    /// <summary>
    /// Get a single product by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        var product = await _productService.GetProductByIdAsync(id);
        if (product == null)
        {
            return NotFound();
        }
        return Ok(product);
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await _adminProductService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { error = "An error occurred while creating the product" });
        }
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product = await _adminProductService.UpdateProductAsync(id, dto);
            return Ok(product);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while updating the product" });
        }
    }

    /// <summary>
    /// Delete a product (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var deleted = await _adminProductService.DeleteProductAsync(id);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    /// <summary>
    /// Bulk update products
    /// </summary>
    [HttpPost("bulk-update")]
    public async Task<ActionResult<BulkOperationResult>> BulkUpdateProducts([FromBody] BulkUpdateProductsDto dto)
    {
        var result = await _adminProductService.BulkUpdateProductsAsync(dto);
        return Ok(result);
    }

    /// <summary>
    /// Bulk delete products
    /// </summary>
    [HttpPost("bulk-delete")]
    public async Task<ActionResult<BulkOperationResult>> BulkDeleteProducts([FromBody] List<Guid> productIds)
    {
        var result = await _adminProductService.BulkDeleteProductsAsync(productIds);
        return Ok(result);
    }

    /// <summary>
    /// Upload product image
    /// </summary>
    [HttpPost("{id}/images")]
    public async Task<ActionResult<string>> UploadProductImage(Guid id, IFormFile file)
    {
        try
        {
            var imageUrl = await _adminProductService.UploadProductImageAsync(id, file);
            return Ok(new { url = imageUrl });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while uploading the image" });
        }
    }

    /// <summary>
    /// Delete product image
    /// </summary>
    [HttpDelete("{id}/images")]
    public async Task<IActionResult> DeleteProductImage(Guid id, [FromQuery] string imageUrl)
    {
        try
        {
            var deleted = await _adminProductService.DeleteProductImageAsync(id, imageUrl);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image for product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while deleting the image" });
        }
    }

    /// <summary>
    /// Import products from CSV
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportResult>> ImportProducts(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Only CSV files are supported" });
        }

        try
        {
            var result = await _adminProductService.ImportProductsFromCsvAsync(file);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing products from CSV");
            return StatusCode(500, new { error = "An error occurred while importing products" });
        }
    }

    /// <summary>
    /// Export products to CSV
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportProducts([FromQuery] ProductFilterRequest filter)
    {
        try
        {
            var csvData = await _adminProductService.ExportProductsToCsvAsync(filter);
            return File(csvData, "text/csv", $"products_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting products to CSV");
            return StatusCode(500, new { error = "An error occurred while exporting products" });
        }
    }

    /// <summary>
    /// Update inventory for multiple products
    /// </summary>
    [HttpPost("inventory/update")]
    public async Task<ActionResult<InventoryUpdateResult>> UpdateInventory([FromBody] List<InventoryUpdateDto> updates)
    {
        try
        {
            var result = await _adminProductService.UpdateInventoryAsync(updates);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating inventory");
            return StatusCode(500, new { error = "An error occurred while updating inventory" });
        }
    }

    /// <summary>
    /// Get low stock products
    /// </summary>
    [HttpGet("low-stock")]
    public async Task<ActionResult<List<ProductDto>>> GetLowStockProducts([FromQuery] int threshold = 10)
    {
        var filter = new ProductFilterRequest
        {
            MaxStock = threshold,
            PageSize = 100,
            SortBy = "stock",
            SortDescending = false
        };
        
        var products = await _productService.GetProductsAsync(filter);
        return Ok(products.Items);
    }

    /// <summary>
    /// Get product statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetProductStatistics()
    {
        // This would typically be implemented in a dedicated service
        var allProducts = await _productService.GetProductsAsync(new ProductFilterRequest { PageSize = 10000 });
        
        var stats = new
        {
            TotalProducts = allProducts.TotalCount,
            ActiveProducts = allProducts.Items.Count(p => p.IsActive),
            InactiveProducts = allProducts.Items.Count(p => !p.IsActive),
            FeaturedProducts = allProducts.Items.Count(p => p.IsFeatured),
            OutOfStock = allProducts.Items.Count(p => p.QuantityInStock == 0),
            LowStock = allProducts.Items.Count(p => p.QuantityInStock > 0 && p.QuantityInStock <= p.LowStockThreshold),
            TotalInventoryValue = allProducts.Items.Sum(p => p.QuantityInStock * (p.Cost ?? p.Price)),
            AveragePrice = allProducts.Items.Any() ? allProducts.Items.Average(p => p.Price) : 0,
            CategoriesInUse = allProducts.Items.Select(p => p.CategoryId).Distinct().Count()
        };

        return Ok(stats);
    }
}