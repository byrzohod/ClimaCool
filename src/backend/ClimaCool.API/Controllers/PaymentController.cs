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
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Create a payment intent for an order
        /// </summary>
        [HttpPost("create-payment-intent")]
        public async Task<ActionResult<PaymentIntentResponseDto>> CreatePaymentIntent([FromBody] CreatePaymentIntentDto dto)
        {
            try
            {
                var userId = GetUserId();
                var result = await _paymentService.CreatePaymentIntentAsync(dto, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error creating payment intent");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating payment intent");
                return StatusCode(500, new { error = "An error occurred processing your payment" });
            }
        }

        /// <summary>
        /// Confirm a payment intent
        /// </summary>
        [HttpPost("confirm-payment")]
        public async Task<ActionResult<PaymentIntentResponseDto>> ConfirmPayment([FromBody] ConfirmPaymentDto dto)
        {
            try
            {
                var userId = GetUserId();
                var result = await _paymentService.ConfirmPaymentAsync(dto, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error confirming payment");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error confirming payment");
                return StatusCode(500, new { error = "An error occurred confirming your payment" });
            }
        }

        /// <summary>
        /// Get payment details by ID
        /// </summary>
        [HttpGet("{paymentId}")]
        public async Task<ActionResult<PaymentDto>> GetPayment(Guid paymentId)
        {
            try
            {
                var payment = await _paymentService.GetPaymentAsync(paymentId);
                return Ok(payment);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get all payments for an order
        /// </summary>
        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetOrderPayments(Guid orderId)
        {
            var payments = await _paymentService.GetOrderPaymentsAsync(orderId);
            return Ok(payments);
        }

        /// <summary>
        /// Create a refund for a payment
        /// </summary>
        [HttpPost("refund")]
        public async Task<ActionResult<RefundDto>> CreateRefund([FromBody] CreateRefundDto dto)
        {
            try
            {
                var userId = GetUserId();
                var refund = await _paymentService.CreateRefundAsync(dto, userId);
                return Ok(refund);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error creating refund");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating refund");
                return StatusCode(500, new { error = "An error occurred processing your refund" });
            }
        }

        /// <summary>
        /// Get refund details by ID
        /// </summary>
        [HttpGet("refund/{refundId}")]
        public async Task<ActionResult<RefundDto>> GetRefund(Guid refundId)
        {
            try
            {
                var refund = await _paymentService.GetRefundAsync(refundId);
                return Ok(refund);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get all refunds for an order
        /// </summary>
        [HttpGet("order/{orderId}/refunds")]
        public async Task<ActionResult<IEnumerable<RefundDto>>> GetOrderRefunds(Guid orderId)
        {
            var refunds = await _paymentService.GetOrderRefundsAsync(orderId);
            return Ok(refunds);
        }

        /// <summary>
        /// Get payment summary for a date range (Admin only)
        /// </summary>
        [HttpGet("summary")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PaymentSummaryDto>> GetPaymentSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var summary = await _paymentService.GetPaymentSummaryAsync(start, end);
            return Ok(summary);
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