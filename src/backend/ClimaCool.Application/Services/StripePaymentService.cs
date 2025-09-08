using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Stripe;
using ClimaCool.Application.Configuration;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Application.Services
{
    public class StripePaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<StripePaymentService> _logger;
        private readonly StripeSettings _stripeSettings;
        private readonly PaymentIntentService _paymentIntentService;
        private readonly PaymentMethodService _paymentMethodService;
        private readonly RefundService _refundService;
        private readonly CustomerService _customerService;

        public StripePaymentService(
            IUnitOfWork unitOfWork,
            IOptions<PaymentSettings> paymentSettings,
            ILogger<StripePaymentService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _stripeSettings = paymentSettings.Value.Stripe;
            
            // Initialize Stripe
            StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
            
            // Initialize Stripe services
            _paymentIntentService = new PaymentIntentService();
            _paymentMethodService = new PaymentMethodService();
            _refundService = new RefundService();
            _customerService = new CustomerService();
        }

        public async Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(CreatePaymentIntentDto dto, Guid userId)
        {
            try
            {
                var user = await _unitOfWork.Users.GetByIdAsync(userId);
                if (user == null)
                    throw new InvalidOperationException("User not found");

                // Get or create Stripe customer
                var stripeCustomerId = await GetOrCreateStripeCustomerAsync(user);

                // Create payment intent options
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(dto.Amount * 100), // Convert to cents
                    Currency = dto.Currency.ToLower(),
                    Customer = stripeCustomerId,
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        { "orderId", dto.OrderId.ToString() },
                        { "userId", userId.ToString() }
                    }
                };

                if (!string.IsNullOrEmpty(dto.PaymentMethodId))
                {
                    options.PaymentMethod = dto.PaymentMethodId;
                    options.Confirm = true;
                }

                // Add custom metadata if provided
                if (dto.Metadata != null)
                {
                    foreach (var kvp in dto.Metadata)
                    {
                        options.Metadata[kvp.Key] = kvp.Value;
                    }
                }

                var paymentIntent = await _paymentIntentService.CreateAsync(options);

                // Create payment record in database
                var payment = new Domain.Entities.Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = dto.OrderId,
                    PaymentIntentId = paymentIntent.Id,
                    Provider = PaymentProvider.Stripe,
                    Method = DeterminePaymentMethod(paymentIntent.PaymentMethodId),
                    Status = MapStripeStatus(paymentIntent.Status),
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.CompleteAsync();

                return new PaymentIntentResponseDto
                {
                    PaymentIntentId = paymentIntent.Id,
                    ClientSecret = paymentIntent.ClientSecret,
                    Status = payment.Status,
                    Amount = dto.Amount,
                    Currency = dto.Currency,
                    RequiresAction = paymentIntent.Status == "requires_action",
                    NextAction = paymentIntent.NextAction?.Type
                };
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error creating payment intent");
                throw new InvalidOperationException($"Payment processing error: {ex.Message}");
            }
        }

        public async Task<PaymentIntentResponseDto> ConfirmPaymentAsync(ConfirmPaymentDto dto, Guid userId)
        {
            try
            {
                var payment = await _unitOfWork.Payments.GetByPaymentIntentIdAsync(dto.PaymentIntentId);
                if (payment == null)
                    throw new InvalidOperationException("Payment not found");

                var options = new PaymentIntentConfirmOptions
                {
                    PaymentMethod = dto.PaymentMethodId
                };

                var paymentIntent = await _paymentIntentService.ConfirmAsync(dto.PaymentIntentId, options);

                // Update payment status
                payment.Status = MapStripeStatus(paymentIntent.Status);
                if (paymentIntent.Status == "succeeded")
                {
                    payment.ProcessedAt = DateTime.UtcNow;
                }

                await _unitOfWork.Payments.UpdateAsync(payment);
                await _unitOfWork.CompleteAsync();

                return new PaymentIntentResponseDto
                {
                    PaymentIntentId = paymentIntent.Id,
                    ClientSecret = paymentIntent.ClientSecret,
                    Status = payment.Status,
                    Amount = payment.Amount,
                    Currency = payment.Currency,
                    RequiresAction = paymentIntent.Status == "requires_action",
                    NextAction = paymentIntent.NextAction?.Type
                };
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error confirming payment");
                throw new InvalidOperationException($"Payment confirmation error: {ex.Message}");
            }
        }

        public async Task<PaymentDto> GetPaymentAsync(Guid paymentId)
        {
            var payment = await _unitOfWork.Payments.GetWithOrderAsync(paymentId);
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

            payment.Status = MapStripeStatus(status);
            if (status == "succeeded")
            {
                payment.ProcessedAt = DateTime.UtcNow;
            }
            else if (status == "payment_failed")
            {
                payment.FailureReason = "Payment failed";
            }

            await _unitOfWork.Payments.UpdateAsync(payment);
            await _unitOfWork.CompleteAsync();

            return MapToPaymentDto(payment);
        }

        public async Task<PaymentMethodDto> AddPaymentMethodAsync(CreatePaymentMethodDto dto, Guid userId)
        {
            try
            {
                var user = await _unitOfWork.Users.GetByIdAsync(userId);
                if (user == null)
                    throw new InvalidOperationException("User not found");

                var stripeCustomerId = await GetOrCreateStripeCustomerAsync(user);

                string stripePaymentMethodId;

                if (!string.IsNullOrEmpty(dto.StripePaymentMethodId))
                {
                    // Attach existing payment method to customer
                    await _paymentMethodService.AttachAsync(dto.StripePaymentMethodId, 
                        new PaymentMethodAttachOptions { Customer = stripeCustomerId });
                    stripePaymentMethodId = dto.StripePaymentMethodId;
                }
                else if (!string.IsNullOrEmpty(dto.CardNumber))
                {
                    // Create new payment method from card details
                    var createOptions = new PaymentMethodCreateOptions
                    {
                        Type = "card",
                        Card = new PaymentMethodCardOptions
                        {
                            Number = dto.CardNumber,
                            ExpMonth = dto.CardExpMonth ?? 0,
                            ExpYear = dto.CardExpYear ?? 0,
                            Cvc = dto.CardCvc
                        }
                    };

                    var stripePaymentMethod = await _paymentMethodService.CreateAsync(createOptions);
                    await _paymentMethodService.AttachAsync(stripePaymentMethod.Id,
                        new PaymentMethodAttachOptions { Customer = stripeCustomerId });
                    stripePaymentMethodId = stripePaymentMethod.Id;
                }
                else
                {
                    throw new InvalidOperationException("Payment method details required");
                }

                // Get payment method details
                var paymentMethod = await _paymentMethodService.GetAsync(stripePaymentMethodId);

                // Save to database
                var dbPaymentMethod = new Domain.Entities.PaymentMethod
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    StripePaymentMethodId = stripePaymentMethodId,
                    Type = paymentMethod.Type,
                    CardBrand = paymentMethod.Card?.Brand,
                    CardLast4 = paymentMethod.Card?.Last4,
                    CardExpMonth = (int?)paymentMethod.Card?.ExpMonth,
                    CardExpYear = (int?)paymentMethod.Card?.ExpYear,
                    CardholderName = dto.CardholderName,
                    IsDefault = dto.SetAsDefault,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (dto.SetAsDefault)
                {
                    await _unitOfWork.PaymentMethods.SetDefaultAsync(dbPaymentMethod.Id, userId);
                }

                await _unitOfWork.PaymentMethods.AddAsync(dbPaymentMethod);
                await _unitOfWork.CompleteAsync();

                return MapToPaymentMethodDto(dbPaymentMethod);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error adding payment method");
                throw new InvalidOperationException($"Error adding payment method: {ex.Message}");
            }
        }

        public async Task<IEnumerable<PaymentMethodDto>> GetUserPaymentMethodsAsync(Guid userId)
        {
            var paymentMethods = await _unitOfWork.PaymentMethods.GetActiveByUserIdAsync(userId);
            return paymentMethods.Select(MapToPaymentMethodDto);
        }

        public async Task<PaymentMethodDto> GetPaymentMethodAsync(Guid paymentMethodId)
        {
            var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(paymentMethodId);
            if (paymentMethod == null)
                throw new InvalidOperationException("Payment method not found");

            return MapToPaymentMethodDto(paymentMethod);
        }

        public async Task<bool> DeletePaymentMethodAsync(Guid paymentMethodId, Guid userId)
        {
            var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(paymentMethodId);
            if (paymentMethod == null || paymentMethod.UserId != userId)
                return false;

            try
            {
                // Detach from Stripe
                await _paymentMethodService.DetachAsync(paymentMethod.StripePaymentMethodId);

                // Deactivate in database
                await _unitOfWork.PaymentMethods.DeactivateAsync(paymentMethodId, userId);
                await _unitOfWork.CompleteAsync();

                return true;
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Error deleting payment method from Stripe");
                // Still deactivate in database even if Stripe fails
                await _unitOfWork.PaymentMethods.DeactivateAsync(paymentMethodId, userId);
                await _unitOfWork.CompleteAsync();
                return true;
            }
        }

        public async Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(Guid paymentMethodId, Guid userId)
        {
            await _unitOfWork.PaymentMethods.SetDefaultAsync(paymentMethodId, userId);
            await _unitOfWork.CompleteAsync();

            var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(paymentMethodId);
            return MapToPaymentMethodDto(paymentMethod!);
        }

        public async Task<RefundDto> CreateRefundAsync(CreateRefundDto dto, Guid processedByUserId)
        {
            try
            {
                var payment = await _unitOfWork.Payments.GetByIdAsync(dto.PaymentId);
                if (payment == null)
                    throw new InvalidOperationException("Payment not found");

                // Create Stripe refund
                var refundOptions = new RefundCreateOptions
                {
                    PaymentIntent = payment.PaymentIntentId,
                    Amount = (long)(dto.Amount * 100), // Convert to cents
                    Reason = MapRefundReason(dto.Reason),
                    Metadata = new Dictionary<string, string>
                    {
                        { "paymentId", dto.PaymentId.ToString() },
                        { "processedBy", processedByUserId.ToString() }
                    }
                };

                var stripeRefund = await _refundService.CreateAsync(refundOptions);

                // Create refund record
                var refund = new Domain.Entities.Refund
                {
                    Id = Guid.NewGuid(),
                    PaymentId = dto.PaymentId,
                    OrderId = payment.OrderId,
                    RefundId = stripeRefund.Id,
                    Amount = dto.Amount,
                    Currency = payment.Currency,
                    Status = MapRefundStatus(stripeRefund.Status),
                    Reason = dto.Reason,
                    Notes = dto.Notes,
                    ProcessedByUserId = processedByUserId,
                    CreatedAt = DateTime.UtcNow
                };

                if (stripeRefund.Status == "succeeded")
                {
                    refund.ProcessedAt = DateTime.UtcNow;
                }

                await _unitOfWork.Refunds.AddAsync(refund);
                await _unitOfWork.CompleteAsync();

                return MapToRefundDto(refund);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error creating refund");
                throw new InvalidOperationException($"Refund processing error: {ex.Message}");
            }
        }

        public async Task<RefundDto> GetRefundAsync(Guid refundId)
        {
            var refund = await _unitOfWork.Refunds.GetWithPaymentAndOrderAsync(refundId);
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

            refund.Status = MapRefundStatus(status);
            if (status == "succeeded")
            {
                refund.ProcessedAt = DateTime.UtcNow;
            }
            else if (status == "failed")
            {
                refund.FailureReason = "Refund failed";
            }

            await _unitOfWork.Refunds.UpdateAsync(refund);
            await _unitOfWork.CompleteAsync();

            return MapToRefundDto(refund);
        }

        public async Task ProcessStripeWebhookAsync(string payload, string signature)
        {
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    payload,
                    signature,
                    _stripeSettings.WebhookSecret
                );

                switch (stripeEvent.Type)
                {
                    case Events.PaymentIntentSucceeded:
                        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                        await UpdatePaymentStatusAsync(paymentIntent!.Id, paymentIntent.Status);
                        break;

                    case Events.PaymentIntentPaymentFailed:
                        var failedPayment = stripeEvent.Data.Object as PaymentIntent;
                        await UpdatePaymentStatusAsync(failedPayment!.Id, failedPayment.Status);
                        break;

                    case Events.ChargeRefunded:
                        var charge = stripeEvent.Data.Object as Charge;
                        if (charge?.Refunds?.Data?.Any() == true)
                        {
                            var refund = charge.Refunds.Data.First();
                            await UpdateRefundStatusAsync(refund.Id, refund.Status);
                        }
                        break;

                    default:
                        _logger.LogInformation($"Unhandled Stripe event type: {stripeEvent.Type}");
                        break;
                }
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook");
                throw;
            }
        }

        public Task ProcessPayPalWebhookAsync(string payload, string signature)
        {
            // PayPal implementation would go here
            throw new NotImplementedException("PayPal integration not yet implemented");
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

        private async Task<string> GetOrCreateStripeCustomerAsync(User user)
        {
            // Check if user already has a Stripe customer ID stored
            // For now, we'll create a new customer each time
            // In production, you'd want to store this in the User entity

            var customerOptions = new CustomerCreateOptions
            {
                Email = user.Email,
                Name = $"{user.FirstName} {user.LastName}",
                Metadata = new Dictionary<string, string>
                {
                    { "userId", user.Id.ToString() }
                }
            };

            var customer = await _customerService.CreateAsync(customerOptions);
            return customer.Id;
        }

        private PaymentStatus MapStripeStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "requires_payment_method" => PaymentStatus.Pending,
                "requires_confirmation" => PaymentStatus.Pending,
                "requires_action" => PaymentStatus.RequiresAction,
                "processing" => PaymentStatus.Processing,
                "requires_capture" => PaymentStatus.RequiresCapture,
                "canceled" => PaymentStatus.Cancelled,
                "succeeded" => PaymentStatus.Succeeded,
                _ => PaymentStatus.Failed
            };
        }

        private RefundStatus MapRefundStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "pending" => RefundStatus.Pending,
                "succeeded" => RefundStatus.Succeeded,
                "failed" => RefundStatus.Failed,
                "canceled" => RefundStatus.Cancelled,
                _ => RefundStatus.Failed
            };
        }

        private string MapRefundReason(RefundReason reason)
        {
            return reason switch
            {
                RefundReason.Duplicate => "duplicate",
                RefundReason.Fraudulent => "fraudulent",
                RefundReason.RequestedByCustomer => "requested_by_customer",
                _ => "requested_by_customer"
            };
        }

        private PaymentMethodEnum DeterminePaymentMethod(string? stripePaymentMethodId)
        {
            // This would need to be enhanced based on actual payment method type
            return PaymentMethodEnum.Card;
        }

        private PaymentDto MapToPaymentDto(Domain.Entities.Payment payment)
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
                CardLast4 = payment.CardLast4,
                CardBrand = payment.CardBrand,
                ProcessedAt = payment.ProcessedAt,
                FailureReason = payment.FailureReason
            };
        }

        private PaymentMethodDto MapToPaymentMethodDto(Domain.Entities.PaymentMethod paymentMethod)
        {
            return new PaymentMethodDto
            {
                Id = paymentMethod.Id,
                StripePaymentMethodId = paymentMethod.StripePaymentMethodId,
                Type = paymentMethod.Type,
                CardBrand = paymentMethod.CardBrand,
                CardLast4 = paymentMethod.CardLast4,
                CardExpMonth = paymentMethod.CardExpMonth,
                CardExpYear = paymentMethod.CardExpYear,
                CardholderName = paymentMethod.CardholderName,
                IsDefault = paymentMethod.IsDefault,
                CreatedAt = paymentMethod.CreatedAt,
                LastUsedAt = paymentMethod.LastUsedAt
            };
        }

        private RefundDto MapToRefundDto(Domain.Entities.Refund refund)
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
    }
}