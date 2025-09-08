using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using ClimaCool.Application.Configuration;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Application.Services
{
    public class PayPalPaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PayPalPaymentService> _logger;
        private readonly PayPalSettings _payPalSettings;
        private readonly HttpClient _httpClient;
        private string? _accessToken;
        private DateTime _tokenExpiry;

        public PayPalPaymentService(
            IUnitOfWork unitOfWork,
            IOptions<PaymentSettings> paymentSettings,
            ILogger<PayPalPaymentService> logger,
            HttpClient httpClient)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _payPalSettings = paymentSettings.Value.PayPal;
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri(_payPalSettings.IsSandbox 
                ? "https://api-m.sandbox.paypal.com" 
                : "https://api-m.paypal.com");
        }

        private async Task<string> GetAccessTokenAsync()
        {
            if (_accessToken != null && _tokenExpiry > DateTime.UtcNow.AddMinutes(5))
            {
                return _accessToken;
            }

            var authValue = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_payPalSettings.ClientId}:{_payPalSettings.ClientSecret}"));
            
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Basic", authValue);

            var requestBody = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            var response = await _httpClient.PostAsync("/v1/oauth2/token", requestBody);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<PayPalTokenResponse>(content);

            _accessToken = tokenResponse?.AccessToken ?? throw new InvalidOperationException("Failed to get PayPal access token");
            _tokenExpiry = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            return _accessToken;
        }

        public async Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(CreatePaymentIntentDto dto, Guid userId)
        {
            try
            {
                var token = await GetAccessTokenAsync();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("Bearer", token);

                var order = new PayPalOrderRequest
                {
                    Intent = "CAPTURE",
                    PurchaseUnits = new[]
                    {
                        new PayPalPurchaseUnit
                        {
                            Amount = new PayPalAmount
                            {
                                CurrencyCode = dto.Currency,
                                Value = dto.Amount.ToString("F2")
                            },
                            ReferenceId = dto.OrderId.ToString()
                        }
                    },
                    ApplicationContext = new PayPalApplicationContext
                    {
                        ReturnUrl = $"{_payPalSettings.ReturnUrl}?orderId={dto.OrderId}",
                        CancelUrl = $"{_payPalSettings.CancelUrl}?orderId={dto.OrderId}"
                    }
                };

                var json = JsonSerializer.Serialize(order);
                var requestContent = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/v2/checkout/orders", requestContent);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var paypalOrder = JsonSerializer.Deserialize<PayPalOrderResponse>(responseContent);

                // Create payment record in database
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = dto.OrderId,
                    PaymentIntentId = paypalOrder?.Id ?? string.Empty,
                    Provider = PaymentProvider.PayPal,
                    Method = PaymentMethodEnum.PayPal,
                    Status = PaymentStatus.Pending,
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.CompleteAsync();

                return new PaymentIntentResponseDto
                {
                    PaymentIntentId = paypalOrder?.Id ?? string.Empty,
                    ClientSecret = paypalOrder?.Id ?? string.Empty, // PayPal uses order ID
                    Status = PaymentStatus.Pending,
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    RequiresAction = true,
                    NextAction = paypalOrder?.Links?.FirstOrDefault(l => l.Rel == "approve")?.Href
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayPal order");
                throw;
            }
        }

        public async Task<PaymentIntentResponseDto> ConfirmPaymentAsync(ConfirmPaymentDto dto, Guid userId)
        {
            try
            {
                var token = await GetAccessTokenAsync();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("Bearer", token);

                // Capture the PayPal order
                var response = await _httpClient.PostAsync(
                    $"/v2/checkout/orders/{dto.PaymentIntentId}/capture", 
                    new StringContent("", Encoding.UTF8, "application/json"));
                
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var captureResponse = JsonSerializer.Deserialize<PayPalCaptureResponse>(responseContent);

                // Update payment record
                var payment = await _unitOfWork.Payments.GetByPaymentIntentIdAsync(dto.PaymentIntentId);
                if (payment != null)
                {
                    payment.Status = captureResponse?.Status == "COMPLETED" 
                        ? PaymentStatus.Succeeded 
                        : PaymentStatus.Failed;
                    payment.ProcessedAt = DateTime.UtcNow;
                    payment.TransactionId = captureResponse?.PurchaseUnits?.FirstOrDefault()?.Payments?.Captures?.FirstOrDefault()?.Id;
                    
                    await _unitOfWork.CompleteAsync();
                }

                return new PaymentIntentResponseDto
                {
                    PaymentIntentId = dto.PaymentIntentId,
                    ClientSecret = dto.PaymentIntentId,
                    Status = payment?.Status ?? PaymentStatus.Failed,
                    Amount = payment?.Amount ?? 0,
                    Currency = payment?.Currency ?? "USD",
                    RequiresAction = false
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming PayPal payment");
                throw;
            }
        }

        public async Task<RefundDto> CreateRefundAsync(CreateRefundDto dto, Guid processedByUserId)
        {
            try
            {
                var payment = await _unitOfWork.Payments.GetByIdAsync(dto.PaymentId);
                if (payment == null)
                    throw new InvalidOperationException("Payment not found");

                var token = await GetAccessTokenAsync();
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("Bearer", token);

                // Get capture ID from transaction ID
                var captureId = payment.TransactionId;
                if (string.IsNullOrEmpty(captureId))
                    throw new InvalidOperationException("No capture ID found for payment");

                var refundRequest = new
                {
                    amount = new
                    {
                        value = dto.Amount.ToString("F2"),
                        currency_code = payment.Currency
                    },
                    note_to_payer = dto.Notes
                };

                var json = JsonSerializer.Serialize(refundRequest);
                var requestContent = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(
                    $"/v2/payments/captures/{captureId}/refund", 
                    requestContent);
                
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var paypalRefund = JsonSerializer.Deserialize<PayPalRefundResponse>(responseContent);

                // Create refund record
                var refund = new Refund
                {
                    Id = Guid.NewGuid(),
                    PaymentId = dto.PaymentId,
                    OrderId = payment.OrderId,
                    RefundId = paypalRefund?.Id ?? string.Empty,
                    Amount = dto.Amount,
                    Currency = payment.Currency,
                    Status = MapPayPalRefundStatus(paypalRefund?.Status),
                    Reason = dto.Reason,
                    Notes = dto.Notes,
                    ProcessedByUserId = processedByUserId,
                    CreatedAt = DateTime.UtcNow,
                    ProcessedAt = paypalRefund?.Status == "COMPLETED" ? DateTime.UtcNow : null
                };

                await _unitOfWork.Refunds.AddAsync(refund);
                await _unitOfWork.CompleteAsync();

                return MapToRefundDto(refund);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayPal refund");
                throw;
            }
        }

        public async Task ProcessStripeWebhookAsync(string payload, string signature)
        {
            throw new NotSupportedException("This is a PayPal service");
        }

        public async Task ProcessPayPalWebhookAsync(string payload, string signature)
        {
            try
            {
                // Verify webhook signature
                if (!await VerifyWebhookSignatureAsync(payload, signature))
                {
                    throw new InvalidOperationException("Invalid webhook signature");
                }

                var webhookEvent = JsonSerializer.Deserialize<PayPalWebhookEvent>(payload);
                if (webhookEvent == null)
                {
                    _logger.LogWarning("Failed to parse PayPal webhook payload");
                    return;
                }

                switch (webhookEvent.EventType)
                {
                    case "PAYMENT.CAPTURE.COMPLETED":
                        await HandlePaymentCompletedAsync(webhookEvent);
                        break;
                    case "PAYMENT.CAPTURE.DENIED":
                        await HandlePaymentDeniedAsync(webhookEvent);
                        break;
                    case "PAYMENT.CAPTURE.REFUNDED":
                        await HandleRefundCompletedAsync(webhookEvent);
                        break;
                    default:
                        _logger.LogInformation($"Unhandled PayPal webhook event: {webhookEvent.EventType}");
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayPal webhook");
                throw;
            }
        }

        private async Task<bool> VerifyWebhookSignatureAsync(string payload, string signature)
        {
            // PayPal webhook verification
            // This would involve calling PayPal's webhook verification endpoint
            // For now, returning true for development
            return await Task.FromResult(true);
        }

        private async Task HandlePaymentCompletedAsync(PayPalWebhookEvent webhookEvent)
        {
            var orderId = webhookEvent.Resource?.SupplementaryData?.RelatedIds?.OrderId;
            if (string.IsNullOrEmpty(orderId))
                return;

            var payment = await _unitOfWork.Payments.GetByPaymentIntentIdAsync(orderId);
            if (payment != null)
            {
                payment.Status = PaymentStatus.Succeeded;
                payment.ProcessedAt = DateTime.UtcNow;
                await _unitOfWork.CompleteAsync();
            }
        }

        private async Task HandlePaymentDeniedAsync(PayPalWebhookEvent webhookEvent)
        {
            var orderId = webhookEvent.Resource?.SupplementaryData?.RelatedIds?.OrderId;
            if (string.IsNullOrEmpty(orderId))
                return;

            var payment = await _unitOfWork.Payments.GetByPaymentIntentIdAsync(orderId);
            if (payment != null)
            {
                payment.Status = PaymentStatus.Failed;
                payment.FailureReason = "Payment denied by PayPal";
                await _unitOfWork.CompleteAsync();
            }
        }

        private async Task HandleRefundCompletedAsync(PayPalWebhookEvent webhookEvent)
        {
            var refundId = webhookEvent.Resource?.Id;
            if (string.IsNullOrEmpty(refundId))
                return;

            var refund = await _unitOfWork.Refunds.GetByRefundIdAsync(refundId);
            if (refund != null)
            {
                refund.Status = RefundStatus.Succeeded;
                refund.ProcessedAt = DateTime.UtcNow;
                await _unitOfWork.CompleteAsync();
            }
        }

        // Implement remaining interface methods
        public async Task<PaymentDto> GetPaymentAsync(Guid paymentId)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId);
            if (payment == null)
                throw new InvalidOperationException("Payment not found");
            return MapToPaymentDto(payment);
        }

        public async Task<IEnumerable<PaymentDto>> GetOrderPaymentsAsync(Guid orderId)
        {
            var payments = await _unitOfWork.Payments.GetByOrderIdAsync(orderId);
            return payments.Select(MapToPaymentDto);
        }

        public async Task<PaymentDto> UpdatePaymentStatusAsync(string paymentIntentId, string status)
        {
            var payment = await _unitOfWork.Payments.GetByPaymentIntentIdAsync(paymentIntentId);
            if (payment == null)
                throw new InvalidOperationException("Payment not found");
            
            payment.Status = Enum.Parse<PaymentStatus>(status, true);
            await _unitOfWork.CompleteAsync();
            return MapToPaymentDto(payment);
        }

        public async Task<RefundDto> GetRefundAsync(Guid refundId)
        {
            var refund = await _unitOfWork.Refunds.GetByIdAsync(refundId);
            if (refund == null)
                throw new InvalidOperationException("Refund not found");
            return MapToRefundDto(refund);
        }

        public async Task<IEnumerable<RefundDto>> GetOrderRefundsAsync(Guid orderId)
        {
            var refunds = await _unitOfWork.Refunds.GetByOrderIdAsync(orderId);
            return refunds.Select(MapToRefundDto);
        }

        public async Task<RefundDto> UpdateRefundStatusAsync(string refundId, string status)
        {
            var refund = await _unitOfWork.Refunds.GetByRefundIdAsync(refundId);
            if (refund == null)
                throw new InvalidOperationException("Refund not found");
            
            refund.Status = Enum.Parse<RefundStatus>(status, true);
            await _unitOfWork.CompleteAsync();
            return MapToRefundDto(refund);
        }

        public async Task<PaymentMethodDto> GetPaymentMethodAsync(Guid paymentMethodId)
        {
            // PayPal doesn't store payment methods in the same way
            throw new NotSupportedException("PayPal does not support individual payment method retrieval");
        }

        public async Task<IEnumerable<PaymentMethodDto>> GetUserPaymentMethodsAsync(Guid userId)
        {
            // PayPal doesn't store payment methods in the same way as Stripe
            // Return empty list or implement PayPal vault
            return await Task.FromResult(new List<PaymentMethodDto>());
        }

        public async Task<PaymentMethodDto> AddPaymentMethodAsync(CreatePaymentMethodDto dto, Guid userId)
        {
            throw new NotSupportedException("PayPal does not support saving payment methods in this way");
        }

        public async Task<bool> DeletePaymentMethodAsync(Guid paymentMethodId, Guid userId)
        {
            throw new NotSupportedException("PayPal does not support saving payment methods in this way");
        }

        public async Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(Guid paymentMethodId, Guid userId)
        {
            throw new NotSupportedException("PayPal does not support saving payment methods in this way");
        }

        public async Task<PaymentSummaryDto> GetPaymentSummaryAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _unitOfWork.Payments.GetByDateRangeAsync(startDate, endDate);
            var refunds = await _unitOfWork.Refunds.GetByDateRangeAsync(startDate, endDate);

            var successfulPayments = payments.Where(p => p.Status == PaymentStatus.Succeeded);
            var failedPayments = payments.Where(p => p.Status == PaymentStatus.Failed);
            var pendingPayments = payments.Where(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Processing);
            var successfulRefunds = refunds.Where(r => r.Status == RefundStatus.Succeeded);

            return new PaymentSummaryDto
            {
                TotalPayments = successfulPayments.Sum(p => p.Amount),
                TotalRefunds = successfulRefunds.Sum(r => r.Amount),
                NetAmount = successfulPayments.Sum(p => p.Amount) - successfulRefunds.Sum(r => r.Amount),
                SuccessfulPayments = successfulPayments.Count(),
                FailedPayments = failedPayments.Count(),
                PendingPayments = pendingPayments.Count()
            };
        }

        private PaymentDto MapToPaymentDto(Payment payment)
        {
            return new PaymentDto
            {
                Id = payment.Id,
                OrderId = payment.OrderId,
                PaymentIntentId = payment.PaymentIntentId,
                Provider = payment.Provider,
                Method = payment.Method,
                Status = payment.Status,
                Amount = payment.Amount,
                Currency = payment.Currency,
                ProcessedAt = payment.ProcessedAt,
                FailureReason = payment.FailureReason
            };
        }

        private RefundDto MapToRefundDto(Refund refund)
        {
            return new RefundDto
            {
                Id = refund.Id,
                PaymentId = refund.PaymentId,
                OrderId = refund.OrderId,
                RefundId = refund.RefundId,
                Amount = refund.Amount,
                Currency = refund.Currency,
                Status = refund.Status,
                Reason = refund.Reason,
                Notes = refund.Notes,
                CreatedAt = refund.CreatedAt,
                ProcessedAt = refund.ProcessedAt,
                FailureReason = refund.FailureReason
            };
        }

        private RefundStatus MapPayPalRefundStatus(string? status)
        {
            return status?.ToUpper() switch
            {
                "COMPLETED" => RefundStatus.Succeeded,
                "PENDING" => RefundStatus.Pending,
                "CANCELLED" => RefundStatus.Cancelled,
                _ => RefundStatus.Failed
            };
        }
    }

    // PayPal DTOs
    internal class PayPalTokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
    }

    internal class PayPalOrderRequest
    {
        public string Intent { get; set; } = string.Empty;
        public PayPalPurchaseUnit[] PurchaseUnits { get; set; } = Array.Empty<PayPalPurchaseUnit>();
        public PayPalApplicationContext ApplicationContext { get; set; } = new();
    }

    internal class PayPalPurchaseUnit
    {
        public PayPalAmount Amount { get; set; } = new();
        public string ReferenceId { get; set; } = string.Empty;
    }

    internal class PayPalAmount
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    internal class PayPalApplicationContext
    {
        public string ReturnUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }

    internal class PayPalOrderResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public PayPalLink[] Links { get; set; } = Array.Empty<PayPalLink>();
    }

    internal class PayPalLink
    {
        public string Href { get; set; } = string.Empty;
        public string Rel { get; set; } = string.Empty;
    }

    internal class PayPalCaptureResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public PayPalPurchaseUnitCapture[] PurchaseUnits { get; set; } = Array.Empty<PayPalPurchaseUnitCapture>();
    }

    internal class PayPalPurchaseUnitCapture
    {
        public PayPalPayments Payments { get; set; } = new();
    }

    internal class PayPalPayments
    {
        public PayPalCapture[] Captures { get; set; } = Array.Empty<PayPalCapture>();
    }

    internal class PayPalCapture
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    internal class PayPalRefundResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    internal class PayPalWebhookEvent
    {
        public string EventType { get; set; } = string.Empty;
        public PayPalWebhookResource Resource { get; set; } = new();
    }

    internal class PayPalWebhookResource
    {
        public string Id { get; set; } = string.Empty;
        public PayPalSupplementaryData SupplementaryData { get; set; } = new();
    }

    internal class PayPalSupplementaryData
    {
        public PayPalRelatedIds RelatedIds { get; set; } = new();
    }

    internal class PayPalRelatedIds
    {
        public string OrderId { get; set; } = string.Empty;
    }
}