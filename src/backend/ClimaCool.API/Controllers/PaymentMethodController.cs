using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Application.Services;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentMethodController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentMethodController> _logger;

        public PaymentMethodController(IPaymentService paymentService, ILogger<PaymentMethodController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Get all payment methods for the current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentMethodDto>>> GetPaymentMethods()
        {
            var userId = GetUserId();
            var paymentMethods = await _paymentService.GetUserPaymentMethodsAsync(userId);
            return Ok(paymentMethods);
        }

        /// <summary>
        /// Get a specific payment method by ID
        /// </summary>
        [HttpGet("{paymentMethodId}")]
        public async Task<ActionResult<PaymentMethodDto>> GetPaymentMethod(Guid paymentMethodId)
        {
            try
            {
                var paymentMethod = await _paymentService.GetPaymentMethodAsync(paymentMethodId);
                
                // Verify the payment method belongs to the current user
                var userId = GetUserId();
                var userMethods = await _paymentService.GetUserPaymentMethodsAsync(userId);
                if (!userMethods.Any(pm => pm.Id == paymentMethodId))
                {
                    return Forbid("You don't have access to this payment method");
                }
                
                return Ok(paymentMethod);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Add a new payment method
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<PaymentMethodDto>> AddPaymentMethod([FromBody] CreatePaymentMethodDto dto)
        {
            try
            {
                var userId = GetUserId();
                var paymentMethod = await _paymentService.AddPaymentMethodAsync(dto, userId);
                return CreatedAtAction(nameof(GetPaymentMethod), new { paymentMethodId = paymentMethod.Id }, paymentMethod);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error adding payment method");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error adding payment method");
                return StatusCode(500, new { error = "An error occurred adding your payment method" });
            }
        }

        /// <summary>
        /// Delete a payment method
        /// </summary>
        [HttpDelete("{paymentMethodId}")]
        public async Task<ActionResult> DeletePaymentMethod(Guid paymentMethodId)
        {
            try
            {
                var userId = GetUserId();
                var deleted = await _paymentService.DeletePaymentMethodAsync(paymentMethodId, userId);
                
                if (!deleted)
                {
                    return NotFound(new { error = "Payment method not found or you don't have permission to delete it" });
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting payment method");
                return StatusCode(500, new { error = "An error occurred deleting your payment method" });
            }
        }

        /// <summary>
        /// Set a payment method as default
        /// </summary>
        [HttpPut("{paymentMethodId}/set-default")]
        public async Task<ActionResult<PaymentMethodDto>> SetDefaultPaymentMethod(Guid paymentMethodId)
        {
            try
            {
                var userId = GetUserId();
                
                // Verify the payment method belongs to the current user
                var userMethods = await _paymentService.GetUserPaymentMethodsAsync(userId);
                if (!userMethods.Any(pm => pm.Id == paymentMethodId))
                {
                    return Forbid("You don't have access to this payment method");
                }
                
                var paymentMethod = await _paymentService.SetDefaultPaymentMethodAsync(paymentMethodId, userId);
                return Ok(paymentMethod);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting default payment method");
                return StatusCode(500, new { error = "An error occurred updating your payment method" });
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }
    }
}