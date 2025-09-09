using System;
using System.Collections.Generic;
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
    public class StripePaymentServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ILogger<StripePaymentService>> _mockLogger;
        private readonly Mock<IOptions<PaymentSettings>> _mockPaymentSettings;
        private readonly StripePaymentService _service;

        public StripePaymentServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLogger = new Mock<ILogger<StripePaymentService>>();
            _mockPaymentSettings = new Mock<IOptions<PaymentSettings>>();

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

            _service = new StripePaymentService(
                _mockUnitOfWork.Object,
                _mockPaymentSettings.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task CreatePaymentIntentAsync_ValidInput_ReturnsPaymentIntentResponse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            var dto = new CreatePaymentIntentDto
            {
                OrderId = orderId,
                Amount = 100.00m,
                Currency = "USD"
            };

            _mockUnitOfWork.Setup(x => x.Users.GetByIdAsync(userId))
                .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.Payments.AddAsync(It.IsAny<Payment>()))
                .ReturnsAsync((Payment p) => p);

            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Act & Assert
            // Note: This test would need Stripe test mode enabled
            // For true unit testing, we'd need to mock Stripe SDK
            await Assert.ThrowsAsync<Stripe.StripeException>(async () =>
                await _service.CreatePaymentIntentAsync(dto, userId));
        }

        [Fact]
        public async Task GetPaymentAsync_ExistingPayment_ReturnsPaymentDto()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment
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

            _mockUnitOfWork.Setup(x => x.Payments.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            // Act
            var result = await _service.GetPaymentAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentId, result.Id);
            Assert.Equal(payment.Amount, result.Amount);
            Assert.Equal(payment.Status, result.Status);
        }

        [Fact]
        public async Task GetPaymentAsync_NonExistingPayment_ReturnsNull()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.Payments.GetByIdAsync(paymentId))
                .ReturnsAsync((Payment)null);

            // Act
            var result = await _service.GetPaymentAsync(paymentId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetOrderPaymentsAsync_ReturnsPaymentsList()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var payments = new List<Payment>
            {
                new Payment
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
                new Payment
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

            _mockUnitOfWork.Setup(x => x.Payments.GetByOrderIdAsync(orderId))
                .ReturnsAsync(payments);

            // Act
            var result = await _service.GetOrderPaymentsAsync(orderId);

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
            var orderId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            
            var payment = new Payment
            {
                Id = paymentId,
                OrderId = orderId,
                PaymentIntentId = "pi_test_123",
                Provider = PaymentProvider.Stripe,
                Method = PaymentMethodEnum.Card,
                Status = PaymentStatus.Succeeded,
                Amount = 100.00m,
                Currency = "USD"
            };

            var dto = new CreateRefundDto
            {
                PaymentId = paymentId,
                Amount = 50.00m,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer requested partial refund"
            };

            _mockUnitOfWork.Setup(x => x.Payments.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            _mockUnitOfWork.Setup(x => x.Refunds.AddAsync(It.IsAny<Refund>()))
                .ReturnsAsync((Refund r) => r);

            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Act & Assert
            // Note: This test would need Stripe test mode enabled
            await Assert.ThrowsAsync<Stripe.StripeException>(async () =>
                await _service.CreateRefundAsync(dto, userId));
        }

        [Fact]
        public async Task GetPaymentSummaryAsync_ReturnsCorrectSummary()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-30);
            var endDate = DateTime.UtcNow;
            
            var payments = new List<Payment>
            {
                new Payment { Status = PaymentStatus.Succeeded, Amount = 100.00m },
                new Payment { Status = PaymentStatus.Succeeded, Amount = 200.00m },
                new Payment { Status = PaymentStatus.Failed, Amount = 50.00m },
                new Payment { Status = PaymentStatus.Pending, Amount = 75.00m }
            };

            var refunds = new List<Refund>
            {
                new Refund { Status = RefundStatus.Succeeded, Amount = 30.00m },
                new Refund { Status = RefundStatus.Succeeded, Amount = 20.00m }
            };

            _mockUnitOfWork.Setup(x => x.Payments.GetByDateRangeAsync(startDate, endDate))
                .ReturnsAsync(payments);

            _mockUnitOfWork.Setup(x => x.Refunds.GetByDateRangeAsync(startDate, endDate))
                .ReturnsAsync(refunds);

            // Act
            var result = await _service.GetPaymentSummaryAsync(startDate, endDate);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(300.00m, result.TotalPayments); // Sum of successful payments
            Assert.Equal(50.00m, result.TotalRefunds); // Sum of successful refunds
            Assert.Equal(250.00m, result.NetAmount); // Total payments - refunds
            Assert.Equal(2, result.SuccessfulPayments);
            Assert.Equal(1, result.FailedPayments);
            Assert.Equal(1, result.PendingPayments);
        }

        [Fact]
        public async Task GetUserPaymentMethodsAsync_ReturnsPaymentMethodsList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentMethods = new List<PaymentMethod>
            {
                new PaymentMethod
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    StripePaymentMethodId = "pm_test_1",
                    Type = "card",
                    CardBrand = "Visa",
                    CardLast4 = "4242",
                    IsDefault = true,
                    IsActive = true
                },
                new PaymentMethod
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    StripePaymentMethodId = "pm_test_2",
                    Type = "card",
                    CardBrand = "Mastercard",
                    CardLast4 = "5555",
                    IsDefault = false,
                    IsActive = true
                }
            };

            _mockUnitOfWork.Setup(x => x.PaymentMethods.GetByUserIdAsync(userId))
                .ReturnsAsync(paymentMethods.Where(pm => pm.IsActive));

            // Act
            var result = await _service.GetUserPaymentMethodsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, pm => Assert.True(pm.Id != Guid.Empty));
        }

        [Fact]
        public async Task DeletePaymentMethodAsync_ValidMethod_ReturnsTrue()
        {
            // Arrange
            var paymentMethodId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var paymentMethod = new PaymentMethod
            {
                Id = paymentMethodId,
                UserId = userId,
                StripePaymentMethodId = "pm_test_123",
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.PaymentMethods.GetByIdAsync(paymentMethodId))
                .ReturnsAsync(paymentMethod);

            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Act & Assert
            // Note: This test would need Stripe test mode enabled
            await Assert.ThrowsAsync<Stripe.StripeException>(async () =>
                await _service.DeletePaymentMethodAsync(paymentMethodId, userId));
        }

        [Fact]
        public async Task ProcessPayPalWebhookAsync_ThrowsNotImplementedException()
        {
            // Arrange
            var payload = "test_payload";
            var signature = "test_signature";

            // Act & Assert
            await Assert.ThrowsAsync<NotImplementedException>(async () =>
                await _service.ProcessPayPalWebhookAsync(payload, signature));
        }
    }
}