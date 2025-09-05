using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Category;
using ClimaCool.Application.Services;
using ClimaCool.Application.Validators.Category;
using Microsoft.Extensions.Logging;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly CreateCategoryValidator _createValidator;
        private readonly UpdateCategoryValidator _updateValidator;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(
            ICategoryService categoryService,
            CreateCategoryValidator createValidator,
            UpdateCategoryValidator updateValidator,
            ILogger<CategoryController> logger)
        {
            _categoryService = categoryService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _categoryService.GetAllCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories");
                return StatusCode(500, new { message = "An error occurred while retrieving categories" });
            }
        }

        [HttpGet("hierarchy")]
        public async Task<IActionResult> GetCategoryHierarchy()
        {
            try
            {
                var hierarchy = await _categoryService.GetCategoryHierarchyAsync();
                return Ok(hierarchy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category hierarchy");
                return StatusCode(500, new { message = "An error occurred while retrieving category hierarchy" });
            }
        }

        [HttpGet("root")]
        public async Task<IActionResult> GetRootCategories()
        {
            try
            {
                var categories = await _categoryService.GetRootCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting root categories");
                return StatusCode(500, new { message = "An error occurred while retrieving root categories" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            try
            {
                var category = await _categoryService.GetCategoryByIdAsync(id);
                if (category == null)
                    return NotFound(new { message = "Category not found" });

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the category" });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetCategoryBySlug(string slug)
        {
            try
            {
                var category = await _categoryService.GetCategoryBySlugAsync(slug);
                if (category == null)
                    return NotFound(new { message = "Category not found" });

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category by slug {Slug}", slug);
                return StatusCode(500, new { message = "An error occurred while retrieving the category" });
            }
        }

        [HttpGet("{id}/product-count")]
        public async Task<IActionResult> GetProductCount(int id)
        {
            try
            {
                var count = await _categoryService.GetProductCountAsync(id);
                return Ok(new { categoryId = id, productCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product count for category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving product count" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            try
            {
                var validationResult = await _createValidator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
                }

                var category = await _categoryService.CreateCategoryAsync(dto);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category");
                return StatusCode(500, new { message = "An error occurred while creating the category" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
        {
            try
            {
                if (id != dto.Id)
                    return BadRequest(new { message = "Category ID mismatch" });

                var validationResult = await _updateValidator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
                }

                var category = await _categoryService.UpdateCategoryAsync(dto);
                return Ok(category);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the category" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var result = await _categoryService.DeleteCategoryAsync(id);
                if (!result)
                    return NotFound(new { message = "Category not found" });

                return NoContent();
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the category" });
            }
        }

        [HttpPut("{id}/display-order")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDisplayOrder(int id, [FromBody] UpdateDisplayOrderDto dto)
        {
            try
            {
                var result = await _categoryService.UpdateDisplayOrderAsync(id, dto.DisplayOrder);
                if (!result)
                    return NotFound(new { message = "Category not found" });

                return Ok(new { message = "Display order updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating display order for category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while updating display order" });
            }
        }
    }

    public class UpdateDisplayOrderDto
    {
        public int DisplayOrder { get; set; }
    }
}