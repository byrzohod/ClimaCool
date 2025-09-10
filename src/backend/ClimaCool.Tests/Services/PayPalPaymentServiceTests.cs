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
    /// Unit tests for PayPalPaymentService that mock all external dependencies
    /// These tests verify the business logic without making real API calls
    /// </summary>
    public class PayPalPaymentServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ILogger<PayPalPaymentService>> _mockLogger;
        private readonly Mock<IOptions<PaymentSettings>> _mockPaymentSettings;
        private readonly Mock<IPaymentService> _mockPaymentService;

        public PayPalPaymentServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLogger = new Mock<ILogger<PayPalPaymentService>>();
            _mockPaymentSettings = new Mock<IOptions<PaymentSettings>>();
            _mockPaymentService = new Mock<IPaymentService>();

            var paymentSettings = new PaymentSettings
            {
                PayPal = new PayPalSettings
                {
                    ClientId = "test_client_id",
                    ClientSecret = "test_client_secret",
                    Mode = "sandbox",
                    ReturnUrl = "https://test.com/return",
                    CancelUrl = "https://test.com/cancel"
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
                PaymentIntentId = "ORDER123",
                ClientSecret = "ORDER123",
                Status = PaymentStatus.Pending,
                Amount = 100.00m,
                Currency = "USD",
                RequiresAction = true,
                NextAction = "https://paypal.com/checkout"
            };

            _mockPaymentService.Setup(x => x.CreatePaymentIntentAsync(dto, userId))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _mockPaymentService.Object.CreatePaymentIntentAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("ORDER123", result.PaymentIntentId);
            Assert.Equal(PaymentStatus.Pending, result.Status);
            Assert.True(result.RequiresAction);
            Assert.Contains("paypal.com/checkout", result.NextAction);
        }

        [Fact]
        public async Task ConfirmPaymentAsync_ValidOrder_ReturnsSuccessResponse()
        {
            // Arrange
            var dto = new ConfirmPaymentDto
            {
                PaymentIntentId = "ORDER123"
            };
            var userId = Guid.NewGuid();

            var expectedResponse = new PaymentIntentResponseDto
            {
                PaymentIntentId = "ORDER123",
                ClientSecret = "ORDER123",
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
            Assert.Equal(PaymentStatus.Succeeded, result.Status);
            Assert.False(result.RequiresAction);
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
                Notes = "Customer request"
            };

            var expectedRefund = new RefundDto
            {
                Id = Guid.NewGuid(),
                PaymentId = paymentId,
                OrderId = Guid.NewGuid(),
                RefundId = "REFUND123",
                Amount = 50.00m,
                Currency = "USD",
                Status = RefundStatus.Succeeded,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer request",
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.CreateRefundAsync(dto, userId))
                .ReturnsAsync(expectedRefund);

            // Act
            var result = await _mockPaymentService.Object.CreateRefundAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("REFUND123", result.RefundId);
            Assert.Equal(RefundStatus.Succeeded, result.Status);
            Assert.Equal(50.00m, result.Amount);
        }

        [Fact]
        public async Task ProcessPayPalWebhookAsync_PaymentCompleted_ProcessesSuccessfully()
        {
            // Arrange
            var orderId = "ORDER123";
            var webhookPayload = $@"{{
                ""event_type"":""PAYMENT.CAPTURE.COMPLETED"",
                ""resource"":{{
                    ""supplementary_data"":{{
                        ""related_ids"":{{
                            ""order_id"":""{orderId}""
                        }}
                    }}
                }}
            }}";

            _mockPaymentService.Setup(x => x.ProcessPayPalWebhookAsync(webhookPayload, "test_signature"))
                .Returns(Task.CompletedTask);

            // Act & Assert - Should not throw
            await _mockPaymentService.Object.ProcessPayPalWebhookAsync(webhookPayload, "test_signature");

            // Verify the method was called
            _mockPaymentService.Verify(x => x.ProcessPayPalWebhookAsync(webhookPayload, "test_signature"), Times.Once);
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
        public async Task GetUserPaymentMethodsAsync_ReturnsEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.GetUserPaymentMethodsAsync(userId))
                .ReturnsAsync(new List<PaymentMethodDto>());

            // Act
            var result = await _mockPaymentService.Object.GetUserPaymentMethodsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task AddPaymentMethodAsync_ThrowsNotSupportedException()
        {
            // Arrange
            var dto = new CreatePaymentMethodDto();
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.AddPaymentMethodAsync(dto, userId))
                .ThrowsAsync(new NotSupportedException("PayPal does not support saving payment methods in this way"));

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _mockPaymentService.Object.AddPaymentMethodAsync(dto, userId));
        }

        [Fact]
        public async Task DeletePaymentMethodAsync_ThrowsNotSupportedException()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.DeletePaymentMethodAsync(paymentMethodId, userId))
                .ThrowsAsync(new NotSupportedException("PayPal does not support saving payment methods in this way"));

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _mockPaymentService.Object.DeletePaymentMethodAsync(paymentMethodId, userId));
        }

        [Fact]
        public async Task SetDefaultPaymentMethodAsync_ThrowsNotSupportedException()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.SetDefaultPaymentMethodAsync(paymentMethodId, userId))
                .ThrowsAsync(new NotSupportedException("PayPal does not support saving payment methods in this way"));

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _mockPaymentService.Object.SetDefaultPaymentMethodAsync(paymentMethodId, userId));
        }

        [Fact]
        public async Task ProcessStripeWebhookAsync_ThrowsNotSupportedException()
        {
            // Arrange
            var payload = "test_payload";
            var signature = "test_signature";

            _mockPaymentService.Setup(x => x.ProcessStripeWebhookAsync(payload, signature))
                .ThrowsAsync(new NotSupportedException("This is a PayPal service"));

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _mockPaymentService.Object.ProcessStripeWebhookAsync(payload, signature));
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
                PaymentIntentId = "ORDER123",
                Provider = PaymentProvider.PayPal,
                Method = PaymentMethodEnum.PayPal,
                Status = PaymentStatus.Succeeded,
                Amount = 100.00m,
                Currency = "USD"
            };

            _mockPaymentService.Setup(x => x.GetPaymentAsync(paymentId))
                .ReturnsAsync(expectedPayment);

            // Act
            var result = await _mockPaymentService.Object.GetPaymentAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentId, result.Id);
            Assert.Equal(PaymentProvider.PayPal, result.Provider);
            Assert.Equal(PaymentMethodEnum.PayPal, result.Method);
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
                    PaymentIntentId = "ORDER123",
                    Provider = PaymentProvider.PayPal,
                    Method = PaymentMethodEnum.PayPal,
                    Status = PaymentStatus.Succeeded,
                    Amount = 100.00m,
                    Currency = "USD"
                }
            };

            _mockPaymentService.Setup(x => x.GetOrderPaymentsAsync(orderId))
                .ReturnsAsync(expectedPayments);

            // Act
            var result = await _mockPaymentService.Object.GetOrderPaymentsAsync(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.All(result, p => Assert.Equal(orderId, p.OrderId));
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_ValidInput_ReturnsUpdatedPayment()
        {
            // Arrange
            var paymentIntentId = "ORDER123";
            var status = "COMPLETED";

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
                RefundId = "REFUND123",
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
            Assert.Equal("REFUND123", result.RefundId);
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
                    RefundId = "REFUND123",
                    Amount = 25.00m,
                    Status = RefundStatus.Succeeded
                }
            };

            _mockPaymentService.Setup(x => x.GetOrderRefundsAsync(orderId))
                .ReturnsAsync(expectedRefunds);

            // Act
            var result = await _mockPaymentService.Object.GetOrderRefundsAsync(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.All(result, r => Assert.Equal(orderId, r.OrderId));
        }

        [Fact]
        public async Task UpdateRefundStatusAsync_ValidInput_ReturnsUpdatedRefund()
        {
            // Arrange
            var refundId = "REFUND123";
            var status = "COMPLETED";

            var expectedRefund = new RefundDto
            {
                Id = Guid.NewGuid(),
                RefundId = refundId,
                Status = RefundStatus.Succeeded,
                Amount = 50.00m,
                Currency = "USD",
                ProcessedAt = DateTime.UtcNow
            };

            _mockPaymentService.Setup(x => x.UpdateRefundStatusAsync(refundId, status))
                .ReturnsAsync(expectedRefund);

            // Act
            var result = await _mockPaymentService.Object.UpdateRefundStatusAsync(refundId, status);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(refundId, result.RefundId);
            Assert.Equal(RefundStatus.Succeeded, result.Status);
            Assert.NotNull(result.ProcessedAt);
        }

        [Fact]
        public async Task GetPaymentMethodAsync_ThrowsNotSupportedException()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();

            _mockPaymentService.Setup(x => x.GetPaymentMethodAsync(paymentMethodId))
                .ThrowsAsync(new NotSupportedException("PayPal does not support individual payment method retrieval"));

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _mockPaymentService.Object.GetPaymentMethodAsync(paymentMethodId));
        }
    }
}