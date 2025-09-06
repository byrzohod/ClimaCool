using ClimaCool.Application.Common;
using ClimaCool.Application.DTOs.Search;

namespace ClimaCool.Application.Services
{
    public interface ISearchService
    {
        /// <summary>
        /// Performs advanced product search with full-text search capabilities
        /// </summary>
        Task<SearchResult> SearchProductsAsync(SearchRequest request);

        /// <summary>
        /// Gets search suggestions for auto-complete functionality
        /// </summary>
        Task<IEnumerable<string>> GetSearchSuggestionsAsync(string query, int maxSuggestions = 10);

        /// <summary>
        /// Gets search facets for filtering options
        /// </summary>
        Task<SearchFacets> GetSearchFacetsAsync(string? searchTerm = null);

        /// <summary>
        /// Indexes a product for search (called when product is created/updated)
        /// </summary>
        Task IndexProductAsync(int productId);

        /// <summary>
        /// Removes a product from search index (called when product is deleted)
        /// </summary>
        Task RemoveProductFromIndexAsync(int productId);

        /// <summary>
        /// Rebuilds the entire search index (admin operation)
        /// </summary>
        Task ReindexAllProductsAsync();
    }
}