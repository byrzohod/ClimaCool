using ClimaCool.Application.Common;
using ClimaCool.Application.DTOs.Product;

namespace ClimaCool.Application.DTOs.Search
{
    public class SearchResult : PagedResult<SearchProductDto>
    {
        public SearchFacets? Facets { get; set; }
        public IEnumerable<string>? Suggestions { get; set; }
        public long SearchTimeMs { get; set; }
        public string? Query { get; set; }
    }

    public class SearchProductDto : ProductListDto
    {
        public float Score { get; set; }
        public Dictionary<string, IEnumerable<string>>? Highlights { get; set; }
    }

    public class SearchFacets
    {
        public IEnumerable<FacetItem> Categories { get; set; } = [];
        public IEnumerable<FacetItem> Brands { get; set; } = [];
        public PriceRangeFacet PriceRange { get; set; } = new();
        public IEnumerable<FacetItem> Ratings { get; set; } = [];
        public StockFacet Stock { get; set; } = new();
    }

    public class FacetItem
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public long Count { get; set; }
        public bool IsSelected { get; set; }
    }

    public class PriceRangeFacet
    {
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public IEnumerable<PriceRange> Ranges { get; set; } = [];
    }

    public class PriceRange
    {
        public decimal From { get; set; }
        public decimal To { get; set; }
        public long Count { get; set; }
        public string Label { get; set; } = string.Empty;
    }

    public class StockFacet
    {
        public long InStockCount { get; set; }
        public long OutOfStockCount { get; set; }
        public long TotalCount { get; set; }
    }
}