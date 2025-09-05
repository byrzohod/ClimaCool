using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Cart;
using ClimaCool.Application.Services;
using Microsoft.Extensions.Logging;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(
            ICartService cartService,
            ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        private string GetSessionId()
        {
            // Get or create session ID from cookie
            var sessionId = Request.Cookies["CartSessionId"];
            if (string.IsNullOrEmpty(sessionId))
            {
                sessionId = Guid.NewGuid().ToString();
                Response.Cookies.Append("CartSessionId", sessionId, new CookieOptions
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.Strict,
                    Secure = true,
                    Expires = DateTimeOffset.UtcNow.AddDays(30)
                });
            }
            return sessionId;
        }

        private Guid? GetUserId()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
                {
                    return userId;
                }
            }
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var cart = await _cartService.GetCartAsync(userId, sessionId);
                if (cart == null)
                {
                    // Return empty cart
                    return Ok(new CartDto { SessionId = sessionId });
                }
                
                return Ok(cart);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart");
                return StatusCode(500, new { message = "An error occurred while retrieving the cart" });
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetCartSummary()
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var summary = await _cartService.GetCartSummaryAsync(userId, sessionId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart summary");
                return StatusCode(500, new { message = "An error occurred while retrieving the cart summary" });
            }
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var cart = await _cartService.AddToCartAsync(userId, sessionId, dto);
                return Ok(cart);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to cart");
                return StatusCode(500, new { message = "An error occurred while adding the item to cart" });
            }
        }

        [HttpPut("items/{productId}")]
        public async Task<IActionResult> UpdateCartItem(int productId, [FromBody] UpdateCartItemDto dto)
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var cart = await _cartService.UpdateCartItemAsync(userId, sessionId, productId, dto);
                return Ok(cart);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cart item {ProductId}", productId);
                return StatusCode(500, new { message = "An error occurred while updating the cart item" });
            }
        }

        [HttpDelete("items/{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId)
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var cart = await _cartService.RemoveFromCartAsync(userId, sessionId, productId);
                return Ok(cart);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing item {ProductId} from cart", productId);
                return StatusCode(500, new { message = "An error occurred while removing the item from cart" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = GetUserId();
                var sessionId = GetSessionId();
                
                var cart = await _cartService.ClearCartAsync(userId, sessionId);
                return Ok(cart);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cart");
                return StatusCode(500, new { message = "An error occurred while clearing the cart" });
            }
        }

        [HttpPost("merge")]
        [Authorize]
        public async Task<IActionResult> MergeCarts()
        {
            try
            {
                var userId = GetUserId();
                if (!userId.HasValue)
                    return Unauthorized();
                    
                var sessionId = GetSessionId();
                
                var result = await _cartService.MergeCartsAsync(userId.Value, sessionId);
                return Ok(new { merged = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error merging carts");
                return StatusCode(500, new { message = "An error occurred while merging carts" });
            }
        }
    }
}