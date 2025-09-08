using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClimaCool.Application.Services;

namespace ClimaCool.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Webhooks are called by external services
    public class WebhookController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(IPaymentService paymentService, ILogger<WebhookController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Handle Stripe webhook events
        /// </summary>
        [HttpPost("stripe")]
        public async Task<IActionResult> HandleStripeWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                
                // Get the Stripe signature from headers
                Request.Headers.TryGetValue("Stripe-Signature", out var signatureHeader);
                
                if (string.IsNullOrEmpty(signatureHeader))
                {
                    _logger.LogWarning("Stripe webhook called without signature");
                    return BadRequest("Missing signature");
                }

                await _paymentService.ProcessStripeWebhookAsync(json, signatureHeader!);
                
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook");
                // Return OK to prevent Stripe from retrying
                // Log the error for investigation
                return Ok();
            }
        }

        /// <summary>
        /// Handle PayPal webhook events
        /// </summary>
        [HttpPost("paypal")]
        public async Task<IActionResult> HandlePayPalWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                
                // Get PayPal headers for verification
                Request.Headers.TryGetValue("PAYPAL-TRANSMISSION-ID", out var transmissionId);
                Request.Headers.TryGetValue("PAYPAL-TRANSMISSION-TIME", out var transmissionTime);
                Request.Headers.TryGetValue("PAYPAL-TRANSMISSION-SIG", out var transmissionSig);
                Request.Headers.TryGetValue("PAYPAL-CERT-URL", out var certUrl);
                Request.Headers.TryGetValue("PAYPAL-AUTH-ALGO", out var authAlgo);
                
                // Combine headers into a signature string for verification
                var signature = $"{transmissionId}|{transmissionTime}|{transmissionSig}|{certUrl}|{authAlgo}";
                
                await _paymentService.ProcessPayPalWebhookAsync(json, signature);
                
                return Ok();
            }
            catch (NotImplementedException)
            {
                _logger.LogInformation("PayPal webhook received but not yet implemented");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayPal webhook");
                // Return OK to prevent PayPal from retrying
                // Log the error for investigation
                return Ok();
            }
        }
    }
}