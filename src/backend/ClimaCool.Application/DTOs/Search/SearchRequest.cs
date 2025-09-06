namespace ClimaCool.Application.DTOs.Search
{
    public class SearchRequest
    {
        public string? Query { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        
        // Filters
        public IList<int>? CategoryIds { get; set; }
        public IList<string>? Brands { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public decimal? MinRating { get; set; }
        public bool? InStockOnly { get; set; }
        public bool? FeaturedOnly { get; set; }
        
        // Sorting
        public string? SortBy { get; set; } = "relevance";
        public bool SortDescending { get; set; } = false;
        
        // Search options
        public bool IncludeHighlights { get; set; } = true;
        public bool IncludeFacets { get; set; } = false;
        public IList<string>? Fields { get; set; } // specific fields to search in
    }
}