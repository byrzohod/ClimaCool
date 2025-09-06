using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Search;
using ClimaCool.Application.Services;
using Microsoft.Extensions.Logging;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;
        private readonly ILogger<SearchController> _logger;

        public SearchController(ISearchService searchService, ILogger<SearchController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        /// <summary>
        /// Performs advanced product search with filtering and faceting
        /// </summary>
        [HttpPost("products")]
        public async Task<IActionResult> SearchProducts([FromBody] SearchRequest request)
        {
            try
            {
                var result = await _searchService.SearchProductsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during product search");
                return StatusCode(500, new { message = "An error occurred during search" });
            }
        }

        /// <summary>
        /// Gets search suggestions for autocomplete
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions(
            [FromQuery] string query,
            [FromQuery] int maxSuggestions = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Query parameter is required" });
            }

            try
            {
                var suggestions = await _searchService.GetSearchSuggestionsAsync(query, maxSuggestions);
                return Ok(new { suggestions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
                return StatusCode(500, new { message = "An error occurred while getting suggestions" });
            }
        }

        /// <summary>
        /// Gets available search facets for filtering
        /// </summary>
        [HttpGet("facets")]
        public async Task<IActionResult> GetFacets([FromQuery] string? searchTerm = null)
        {
            try
            {
                var facets = await _searchService.GetSearchFacetsAsync(searchTerm);
                return Ok(facets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search facets");
                return StatusCode(500, new { message = "An error occurred while getting facets" });
            }
        }

        /// <summary>
        /// Admin endpoint to reindex all products
        /// </summary>
        [HttpPost("reindex")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReindexProducts()
        {
            try
            {
                await _searchService.ReindexAllProductsAsync();
                return Ok(new { message = "Reindex operation started successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during reindex operation");
                return StatusCode(500, new { message = "An error occurred during reindex" });
            }
        }

        /// <summary>
        /// Admin endpoint to index a specific product
        /// </summary>
        [HttpPost("index/product/{productId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> IndexProduct(int productId)
        {
            try
            {
                await _searchService.IndexProductAsync(productId);
                return Ok(new { message = $"Product {productId} indexed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error indexing product {ProductId}", productId);
                return StatusCode(500, new { message = "An error occurred while indexing the product" });
            }
        }

        /// <summary>
        /// Admin endpoint to remove a product from search index
        /// </summary>
        [HttpDelete("index/product/{productId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveProductFromIndex(int productId)
        {
            try
            {
                await _searchService.RemoveProductFromIndexAsync(productId);
                return Ok(new { message = $"Product {productId} removed from index successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing product {ProductId} from index", productId);
                return StatusCode(500, new { message = "An error occurred while removing the product from index" });
            }
        }
    }
}