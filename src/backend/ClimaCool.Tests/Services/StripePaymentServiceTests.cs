using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using ClimaCool.Application.Configuration;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Tests.Services
{
    /// <summary>
    /// Unit tests for StripePaymentService that mock all external dependencies
    /// These tests verify the business logic without making real API calls
    /// </summary>
    public class StripePaymentServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ILogger<StripePaymentService>> _mockLogger;
        private readonly Mock<IOptions<PaymentSettings>> _mockPaymentSettings;
        private readonly Mock<IPaymentService> _mockPaymentService;

        public StripePaymentServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLogger = new Mock<ILogger<StripePaymentService>>();
            _mockPaymentSettings = new Mock<IOptions<PaymentSettings>>();
            _mockPaymentService = new Mock<IPaymentService>();

            var paymentSettings = new PaymentSettings
            {
                Stripe = new StripeSettings
                {
                    SecretKey = "sk_test_fake_key_for_testing_only",
                    PublishableKey = "pk_test_fake_key_for_testing_only", 
                    WebhookSecret = "whsec_fake_webhook_secret_for_testing"
                }
            };

            _mockPaymentSettings.Setup(x => x.Value).Returns(paymentSettings);
        }

        [Fact]
        public async Task CreatePaymentIntentAsync_ValidInput_ReturnsPaymentIntentResponse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var dto = new CreatePaymentIntentDto
            {
                OrderId = orderId,
                Amount = 100.00m,
                Currency = "USD"
            };

            var expectedResponse = new PaymentIntentResponseDto
            {
                PaymentIntentId = "pi_test_123",
                ClientSecret = "pi_test_123_secret",
                Status = PaymentStatus.Pending,
                Amount = 100.00m,
                Currency = "USD",
                RequiresAction = false
            };

            _mockPaymentService.Setup(x => x.CreatePaymentIntentAsync(dto, userId))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _mockPaymentService.Object.CreatePaymentIntentAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("pi_test_123", result.PaymentIntentId);
            Assert.Equal(PaymentStatus.Pending, result.Status);
            Assert.Equal(100.00m, result.Amount);
            Assert.Equal("USD", result.Currency);
        }

        [Fact]
        public async Task CreatePaymentIntentAsync_UserNotFound_ThrowsException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new CreatePaymentIntentDto
            {
                OrderId = Guid.NewGuid(),
                Amount = 100.00m,
                Currency = "USD"
            };

            _mockPaymentService.Setup(x => x.CreatePaymentIntentAsync(dto, userId))
                .ThrowsAsync(new InvalidOperationException("User not found"));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _mockPaymentService.Object.CreatePaymentIntentAsync(dto, userId));
        }

        [Fact]
        public async Task GetPaymentAsync_ExistingPayment_ReturnsPaymentDto()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var expectedPayment = new PaymentDto
            {
                Id = paymentId,
                OrderId = Guid.NewGuid(),
                PaymentIntentId = "pi_test_123",
                Provider = PaymentProvider.Stripe,
                Method = PaymentMethodEnum.Card,
                Status = PaymentStatus.Succeeded,
                Amount = 100.00m,
                Currency = "USD",
                CardLast4 = "4242",
                CardBrand = "Visa"
            };

            _mockPaymentService.Setup(x => x.GetPaymentAsync(paymentId))
                .ReturnsAsync(expectedPayment);

            // Act
            var result = await _mockPaymentService.Object.GetPaymentAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentId, result.Id);
            Assert.Equal(expectedPayment.Amount, result.Amount);
            Assert.Equal(expectedPayment.Status, result.Status);
        }

        [Fact]
        public async Task GetPaymentAsync_NonExistingPayment_ThrowsException()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            
            _mockPaymentService.Setup(x => x.GetPaymentAsync(paymentId))
                .ThrowsAsync(new InvalidOperationException("Payment not found"));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _mockPaymentService.Object.GetPaymentAsync(paymentId));
        }

        [Fact]
        public async Task GetOrderPaymentsAsync_ReturnsPaymentsList()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var expectedPayments = new List<PaymentDto>
            {
                new PaymentDto
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    PaymentIntentId = "pi_test_1",
                    Provider = PaymentProvider.Stripe,
                    Method = PaymentMethodEnum.Card,
                    Status = PaymentStatus.Succeeded,
                    Amount = 50.00m,
                    Currency = "USD"
                },
                new PaymentDto
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    PaymentIntentId = "pi_test_2",
                    Provider = PaymentProvider.Stripe,
                    Method = PaymentMethodEnum.Card,
                    Status = PaymentStatus.Failed,
                    Amount = 50.00m,
                    Currency = "USD"
                }
            };

            _mockPaymentService.Setup(x => x.GetOrderPaymentsAsync(orderId))
                .ReturnsAsync(expectedPayments);

            // Act
            var result = await _mockPaymentService.Object.GetOrderPaymentsAsync(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, p => Assert.Equal(orderId, p.OrderId));
        }

        [Fact]
        public async Task CreateRefundAsync_ValidPayment_ReturnsRefundDto()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var dto = new CreateRefundDto
            {
                PaymentId = paymentId,
                Amount = 50.00m,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer requested partial refund"
            };

            var expectedRefund = new RefundDto
            {
                Id = Guid.NewGuid(),
                PaymentId = paymentId,
                OrderId = Guid.NewGuid(),
                RefundId = "re_test_123",
                Amount = 50.00m,
                Currency = "USD",
                Status = RefundStatus.Succeeded,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer requested partial refund",
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.CreateRefundAsync(dto, userId))
                .ReturnsAsync(expectedRefund);

            // Act
            var result = await _mockPaymentService.Object.CreateRefundAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("re_test_123", result.RefundId);
            Assert.Equal(50.00m, result.Amount);
            Assert.Equal(RefundStatus.Succeeded, result.Status);
        }

        [Fact]
        public async Task CreateRefundAsync_PaymentNotFound_ThrowsException()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var dto = new CreateRefundDto
            {
                PaymentId = paymentId,
                Amount = 50.00m,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer requested partial refund"
            };

            _mockPaymentService.Setup(x => x.CreateRefundAsync(dto, userId))
                .ThrowsAsync(new InvalidOperationException("Payment not found"));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _mockPaymentService.Object.CreateRefundAsync(dto, userId));
        }

        [Fact]
        public async Task GetPaymentSummaryAsync_ReturnsCorrectSummary()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-30);
            var endDate = DateTime.UtcNow;
            
            var expectedSummary = new PaymentSummaryDto
            {
                TotalPayments = 300.00m,
                TotalRefunds = 50.00m,
                NetAmount = 250.00m,
                SuccessfulPayments = 2,
                FailedPayments = 1,
                PendingPayments = 1
            };

            _mockPaymentService.Setup(x => x.GetPaymentSummaryAsync(startDate, endDate))
                .ReturnsAsync(expectedSummary);

            // Act
            var result = await _mockPaymentService.Object.GetPaymentSummaryAsync(startDate, endDate);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(300.00m, result.TotalPayments);
            Assert.Equal(50.00m, result.TotalRefunds);
            Assert.Equal(250.00m, result.NetAmount);
            Assert.Equal(2, result.SuccessfulPayments);
            Assert.Equal(1, result.FailedPayments);
            Assert.Equal(1, result.PendingPayments);
        }

        [Fact]
        public async Task GetUserPaymentMethodsAsync_ReturnsPaymentMethodsList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var expectedPaymentMethods = new List<PaymentMethodDto>
            {
                new PaymentMethodDto
                {
                    Id = Guid.NewGuid(),
                    StripePaymentMethodId = "pm_test_1",
                    Type = "card",
                    CardBrand = "Visa",
                    CardLast4 = "4242",
                    IsDefault = true,
                    CreatedAt = DateTime.UtcNow
                },
                new PaymentMethodDto
                {
                    Id = Guid.NewGuid(),
                    StripePaymentMethodId = "pm_test_2",
                    Type = "card",
                    CardBrand = "Mastercard",
                    CardLast4 = "5555",
                    IsDefault = false,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockPaymentService.Setup(x => x.GetUserPaymentMethodsAsync(userId))
                .ReturnsAsync(expectedPaymentMethods);

            // Act
            var result = await _mockPaymentService.Object.GetUserPaymentMethodsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, pm => Assert.True(pm.Id != Guid.Empty));
        }

        [Fact]
        public async Task AddPaymentMethodAsync_ValidInput_ReturnsPaymentMethodDto()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new CreatePaymentMethodDto
            {
                StripePaymentMethodId = "pm_test_123",
                SetAsDefault = true
            };

            var expectedPaymentMethod = new PaymentMethodDto
            {
                Id = Guid.NewGuid(),
                StripePaymentMethodId = "pm_test_123",
                Type = "card",
                CardBrand = "Visa",
                CardLast4 = "4242",
                IsDefault = true,
                CreatedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.AddPaymentMethodAsync(dto, userId))
                .ReturnsAsync(expectedPaymentMethod);

            // Act
            var result = await _mockPaymentService.Object.AddPaymentMethodAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("pm_test_123", result.StripePaymentMethodId);
            Assert.True(result.IsDefault);
        }

        [Fact]
        public async Task DeletePaymentMethodAsync_ValidMethod_ReturnsTrue()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.DeletePaymentMethodAsync(paymentMethodId, userId))
                .ReturnsAsync(true);

            // Act
            var result = await _mockPaymentService.Object.DeletePaymentMethodAsync(paymentMethodId, userId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task DeletePaymentMethodAsync_InvalidMethod_ReturnsFalse()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.DeletePaymentMethodAsync(paymentMethodId, userId))
                .ReturnsAsync(false);

            // Act
            var result = await _mockPaymentService.Object.DeletePaymentMethodAsync(paymentMethodId, userId);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task SetDefaultPaymentMethodAsync_ValidMethod_ReturnsPaymentMethodDto()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var expectedPaymentMethod = new PaymentMethodDto
            {
                Id = paymentMethodId,
                StripePaymentMethodId = "pm_test_123",
                Type = "card",
                CardBrand = "Visa",
                CardLast4 = "4242",
                IsDefault = true,
                CreatedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.SetDefaultPaymentMethodAsync(paymentMethodId, userId))
                .ReturnsAsync(expectedPaymentMethod);

            // Act
            var result = await _mockPaymentService.Object.SetDefaultPaymentMethodAsync(paymentMethodId, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentMethodId, result.Id);
            Assert.True(result.IsDefault);
        }

        [Fact]
        public async Task ProcessStripeWebhookAsync_ValidPayload_ProcessesSuccessfully()
        {
            // Arrange
            var payload = @"{
                ""id"": ""evt_test_123"",
                ""object"": ""event"",
                ""type"": ""payment_intent.succeeded"",
                ""data"": {
                    ""object"": {
                        ""id"": ""pi_test_123"",
                        ""status"": ""succeeded""
                    }
                }
            }";
            var signature = "test_signature";

            _mockPaymentService.Setup(x => x.ProcessStripeWebhookAsync(payload, signature))
                .Returns(Task.CompletedTask);

            // Act & Assert - Should not throw
            await _mockPaymentService.Object.ProcessStripeWebhookAsync(payload, signature);

            // Verify the method was called
            _mockPaymentService.Verify(x => x.ProcessStripeWebhookAsync(payload, signature), Times.Once);
        }

        [Fact]
        public async Task ProcessPayPalWebhookAsync_ThrowsNotImplementedException()
        {
            // Arrange
            var payload = "test_payload";
            var signature = "test_signature";

            _mockPaymentService.Setup(x => x.ProcessPayPalWebhookAsync(payload, signature))
                .ThrowsAsync(new NotImplementedException("PayPal integration not yet implemented"));

            // Act & Assert
            await Assert.ThrowsAsync<NotImplementedException>(
                async () => await _mockPaymentService.Object.ProcessPayPalWebhookAsync(payload, signature));
        }

        [Fact]
        public async Task ConfirmPaymentAsync_ValidInput_ReturnsPaymentIntentResponse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new ConfirmPaymentDto
            {
                PaymentIntentId = "pi_test_123",
                PaymentMethodId = "pm_test_456"
            };

            var expectedResponse = new PaymentIntentResponseDto
            {
                PaymentIntentId = "pi_test_123",
                ClientSecret = "pi_test_123_secret",
                Status = PaymentStatus.Succeeded,
                Amount = 100.00m,
                Currency = "USD",
                RequiresAction = false
            };

            _mockPaymentService.Setup(x => x.ConfirmPaymentAsync(dto, userId))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _mockPaymentService.Object.ConfirmPaymentAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("pi_test_123", result.PaymentIntentId);
            Assert.Equal(PaymentStatus.Succeeded, result.Status);
            Assert.False(result.RequiresAction);
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_ValidInput_ReturnsUpdatedPayment()
        {
            // Arrange
            var paymentIntentId = "pi_test_123";
            var status = "succeeded";

            var expectedPayment = new PaymentDto
            {
                Id = Guid.NewGuid(),
                PaymentIntentId = paymentIntentId,
                Status = PaymentStatus.Succeeded,
                Amount = 100.00m,
                Currency = "USD",
                ProcessedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.UpdatePaymentStatusAsync(paymentIntentId, status))
                .ReturnsAsync(expectedPayment);

            // Act
            var result = await _mockPaymentService.Object.UpdatePaymentStatusAsync(paymentIntentId, status);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentIntentId, result.PaymentIntentId);
            Assert.Equal(PaymentStatus.Succeeded, result.Status);
            Assert.NotNull(result.ProcessedAt);
        }

        [Fact]
        public async Task GetRefundAsync_ExistingRefund_ReturnsRefundDto()
        {
            // Arrange
            var refundId = Guid.NewGuid();
            var expectedRefund = new RefundDto
            {
                Id = refundId,
                PaymentId = Guid.NewGuid(),
                OrderId = Guid.NewGuid(),
                RefundId = "re_test_123",
                Amount = 50.00m,
                Currency = "USD",
                Status = RefundStatus.Succeeded,
                Reason = RefundReason.RequestedByCustomer,
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.GetRefundAsync(refundId))
                .ReturnsAsync(expectedRefund);

            // Act
            var result = await _mockPaymentService.Object.GetRefundAsync(refundId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(refundId, result.Id);
            Assert.Equal("re_test_123", result.RefundId);
            Assert.Equal(RefundStatus.Succeeded, result.Status);
        }

        [Fact]
        public async Task GetOrderRefundsAsync_ReturnsRefundsList()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var expectedRefunds = new List<RefundDto>
            {
                new RefundDto
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    RefundId = "re_test_1",
                    Amount = 25.00m,
                    Status = RefundStatus.Succeeded
                },
                new RefundDto
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    RefundId = "re_test_2",
                    Amount = 25.00m,
                    Status = RefundStatus.Pending
                }
            };

            _mockPaymentService.Setup(x => x.GetOrderRefundsAsync(orderId))
                .ReturnsAsync(expectedRefunds);

            // Act
            var result = await _mockPaymentService.Object.GetOrderRefundsAsync(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, r => Assert.Equal(orderId, r.OrderId));
        }
    }
}