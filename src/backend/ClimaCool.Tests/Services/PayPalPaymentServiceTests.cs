using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Xunit;
using ClimaCool.Application.Configuration;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Enums;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Tests.Services
{
    public class PayPalPaymentServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ILogger<PayPalPaymentService>> _mockLogger;
        private readonly Mock<IOptions<PaymentSettings>> _mockPaymentSettings;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly PayPalPaymentService _service;

        public PayPalPaymentServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLogger = new Mock<ILogger<PayPalPaymentService>>();
            _mockPaymentSettings = new Mock<IOptions<PaymentSettings>>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();

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

            var httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://api-m.sandbox.paypal.com")
            };

            _mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(httpClient);

            _service = new PayPalPaymentService(
                _mockUnitOfWork.Object,
                _mockPaymentSettings.Object,
                _mockLogger.Object,
                httpClient
            );
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

            // Mock OAuth token response
            var tokenResponse = @"{""access_token"":""test_token"",""expires_in"":3600}";
            SetupHttpResponse(HttpStatusCode.OK, tokenResponse);

            // Mock create order response
            var orderResponse = @"{
                ""id"":""ORDER123"",
                ""status"":""CREATED"",
                ""links"":[{""rel"":""approve"",""href"":""https://paypal.com/checkout""}]
            }";
            SetupHttpResponse(HttpStatusCode.OK, orderResponse);

            _mockUnitOfWork.Setup(x => x.Payments.AddAsync(It.IsAny<Payment>()))
                .ReturnsAsync((Payment p) => p);
            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _service.CreatePaymentIntentAsync(dto, userId);

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
            
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = Guid.NewGuid(),
                PaymentIntentId = "ORDER123",
                Amount = 100.00m,
                Currency = "USD",
                Status = PaymentStatus.Pending
            };

            _mockUnitOfWork.Setup(x => x.Payments.GetByPaymentIntentIdAsync("ORDER123"))
                .ReturnsAsync(payment);
            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Mock OAuth token response
            var tokenResponse = @"{""access_token"":""test_token"",""expires_in"":3600}";
            SetupHttpResponse(HttpStatusCode.OK, tokenResponse);

            // Mock capture response
            var captureResponse = @"{
                ""id"":""ORDER123"",
                ""status"":""COMPLETED"",
                ""purchase_units"":[{
                    ""payments"":{
                        ""captures"":[{""id"":""CAPTURE123""}]
                    }
                }]
            }";
            SetupHttpResponse(HttpStatusCode.OK, captureResponse);

            // Act
            var result = await _service.ConfirmPaymentAsync(dto, userId);

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
            var payment = new Payment
            {
                Id = paymentId,
                OrderId = Guid.NewGuid(),
                PaymentIntentId = "ORDER123",
                TransactionId = "CAPTURE123",
                Amount = 100.00m,
                Currency = "USD",
                Status = PaymentStatus.Succeeded
            };

            var dto = new CreateRefundDto
            {
                PaymentId = paymentId,
                Amount = 50.00m,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer request"
            };

            _mockUnitOfWork.Setup(x => x.Payments.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);
            _mockUnitOfWork.Setup(x => x.Refunds.AddAsync(It.IsAny<Refund>()))
                .ReturnsAsync((Refund r) => r);
            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Mock OAuth token response
            var tokenResponse = @"{""access_token"":""test_token"",""expires_in"":3600}";
            SetupHttpResponse(HttpStatusCode.OK, tokenResponse);

            // Mock refund response
            var refundResponse = @"{""id"":""REFUND123"",""status"":""COMPLETED""}";
            SetupHttpResponse(HttpStatusCode.OK, refundResponse);

            // Act
            var result = await _service.CreateRefundAsync(dto, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("REFUND123", result.RefundId);
            Assert.Equal(RefundStatus.Succeeded, result.Status);
            Assert.Equal(50.00m, result.Amount);
        }

        [Fact]
        public async Task ProcessPayPalWebhookAsync_PaymentCompleted_UpdatesPaymentStatus()
        {
            // Arrange
            var orderId = "ORDER123";
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                PaymentIntentId = orderId,
                Status = PaymentStatus.Pending
            };

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

            _mockUnitOfWork.Setup(x => x.Payments.GetByPaymentIntentIdAsync(orderId))
                .ReturnsAsync(payment);
            _mockUnitOfWork.Setup(x => x.CompleteAsync())
                .ReturnsAsync(1);

            // Act
            await _service.ProcessPayPalWebhookAsync(webhookPayload, "test_signature");

            // Assert
            Assert.Equal(PaymentStatus.Succeeded, payment.Status);
            Assert.NotNull(payment.ProcessedAt);
            _mockUnitOfWork.Verify(x => x.CompleteAsync(), Times.Once);
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

            // Act
            var result = await _service.GetUserPaymentMethodsAsync(userId);

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

            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _service.AddPaymentMethodAsync(dto, userId));
        }

        [Fact]
        public async Task ProcessStripeWebhookAsync_ThrowsNotSupportedException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NotSupportedException>(
                async () => await _service.ProcessStripeWebhookAsync("payload", "signature"));
        }

        private void SetupHttpResponse(HttpStatusCode statusCode, string content)
        {
            _mockHttpMessageHandler.Protected()
                .SetupSequence<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(content)
                });
        }
    }
}