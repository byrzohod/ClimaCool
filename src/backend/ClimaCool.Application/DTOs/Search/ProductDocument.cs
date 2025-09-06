using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;

namespace ClimaCool.Application.DTOs.Search
{
    /// <summary>
    /// OpenSearch document representation of a Product for search indexing
    /// </summary>
    public class ProductDocument
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        
        // Category information
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryPath { get; set; } = string.Empty; // e.g., "HVAC > Air Conditioners > Central"
        
        // Product classification
        public ProductType ProductType { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public bool InStock { get; set; }
        public int StockQuantity { get; set; }
        
        // Images
        public string? PrimaryImageUrl { get; set; }
        public IList<string> ImageUrls { get; set; } = [];
        
        // Reviews and ratings
        public decimal? AverageRating { get; set; }
        public int ReviewCount { get; set; }
        
        // Searchable attributes (for faceting and filtering)
        public IList<string> Attributes { get; set; } = []; // e.g., ["Cooling Capacity: 3.5 Ton", "Energy Rating: 5 Star"]
        public IList<string> Tags { get; set; } = []; // e.g., ["energy-efficient", "residential", "commercial"]
        
        // Dates
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Full-text search fields (these will be analyzed)
        public string SearchText { get; set; } = string.Empty; // Combined searchable content
        public string Suggest { get; set; } = string.Empty; // For autocomplete

        /// <summary>
        /// Factory method to create ProductDocument from Product entity
        /// </summary>
        public static ProductDocument FromProduct(ClimaCool.Domain.Entities.Product product)
        {
            return new ProductDocument
            {
                Id = product.Id,
                Name = product.Name,
                Slug = product.Slug,
                Description = product.Description ?? string.Empty,
                ShortDescription = product.ShortDescription ?? string.Empty,
                SKU = product.SKU,
                Price = product.Price,
                CompareAtPrice = product.CompareAtPrice,
                Brand = product.Brand ?? string.Empty,
                Model = product.Model ?? string.Empty,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name ?? string.Empty,
                CategoryPath = BuildCategoryPath(product.Category),
                ProductType = product.ProductType,
                IsActive = product.IsActive,
                IsFeatured = product.IsFeatured,
                InStock = product.StockQuantity > 0,
                StockQuantity = product.StockQuantity,
                PrimaryImageUrl = product.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
                ImageUrls = product.Images.Select(i => i.ImageUrl).ToList(),
                AverageRating = product.Reviews.Any() ? (decimal)product.Reviews.Average(r => r.Rating) : null,
                ReviewCount = product.Reviews.Count,
                Attributes = product.Attributes.Select(a => $"{a.Name}: {a.Value}").ToList(),
                Tags = ExtractTags(product),
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                SearchText = BuildSearchText(product),
                Suggest = BuildSuggestText(product)
            };
        }

        private static string BuildCategoryPath(ClimaCool.Domain.Entities.Category? category)
        {
            if (category == null) return string.Empty;
            
            var path = new List<string>();
            var current = category;
            
            while (current != null)
            {
                path.Insert(0, current.Name);
                current = current.ParentCategory;
            }
            
            return string.Join(" > ", path);
        }

        private static string BuildSearchText(ClimaCool.Domain.Entities.Product product)
        {
            var textParts = new List<string>
            {
                product.Name,
                product.Description ?? string.Empty,
                product.ShortDescription ?? string.Empty,
                product.SKU,
                product.Brand ?? string.Empty,
                product.Model ?? string.Empty,
                product.Category?.Name ?? string.Empty
            };
            
            // Add attributes text
            textParts.AddRange(product.Attributes.Select(a => $"{a.Name} {a.Value}"));
            
            return string.Join(" ", textParts.Where(t => !string.IsNullOrWhiteSpace(t)));
        }

        private static string BuildSuggestText(ClimaCool.Domain.Entities.Product product)
        {
            var suggestions = new List<string>
            {
                product.Name,
                product.Brand ?? string.Empty,
                product.Model ?? string.Empty,
                product.Category?.Name ?? string.Empty
            };
            
            return string.Join(" ", suggestions.Where(s => !string.IsNullOrWhiteSpace(s)));
        }

        private static List<string> ExtractTags(ClimaCool.Domain.Entities.Product product)
        {
            var tags = new List<string>();
            
            // Add tags based on product type
            tags.Add(product.ProductType.ToString().ToLowerInvariant());
            
            // Add stock status
            tags.Add(product.StockQuantity > 0 ? "in-stock" : "out-of-stock");
            
            // Add featured tag
            if (product.IsFeatured)
                tags.Add("featured");
            
            // Add price range tags
            if (product.Price < 1000)
                tags.Add("budget");
            else if (product.Price < 5000)
                tags.Add("mid-range");
            else
                tags.Add("premium");
            
            // Add rating tags if reviews exist
            if (product.Reviews.Any())
            {
                var avgRating = product.Reviews.Average(r => r.Rating);
                if (avgRating >= 4.5)
                    tags.Add("highly-rated");
                else if (avgRating >= 4.0)
                    tags.Add("well-rated");
            }
            
            return tags;
        }
    }
}