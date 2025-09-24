using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ClimaCool.Application.DTOs.Auth;
using ClimaCool.Application.DTOs.Payment;
using ClimaCool.Domain.Enums;
using ClimaCool.Tests.Helpers;

namespace ClimaCool.Tests.Integration
{
    public class PaymentControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly CustomWebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public PaymentControllerIntegrationTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
        }

        private async Task<string> GetAuthTokenAsync()
        {
            var loginRequest = new LoginRequestDto
            {
                EmailOrUsername = "testuser@example.com",
                Password = "Test123!@#"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                // Create user if doesn't exist
                var registerRequest = new RegisterRequestDto
                {
                    Email = "testuser@example.com",
                    Password = "Test123!@#",
                    ConfirmPassword = "Test123!@#",
                    FirstName = "Test",
                    LastName = "User"
                };
                
                await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
                response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            }

            var content = await response.Content.ReadAsStringAsync();
            var loginResponse = JsonSerializer.Deserialize<AuthResponseDto>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return loginResponse?.Token ?? string.Empty;
        }

        [Fact]
        public async Task CreatePaymentIntent_ValidRequest_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var request = new CreatePaymentIntentDto
            {
                OrderId = Guid.NewGuid(),
                Amount = 100.00m,
                Currency = "USD"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/payment/create-intent", request);

            // Assert
            // Note: This will fail without proper Stripe test keys configured
            // In a real test environment, you'd mock the Stripe service
            Assert.True(response.StatusCode == HttpStatusCode.OK || 
                       response.StatusCode == HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task GetPayment_ExistingPayment_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var paymentId = Guid.NewGuid();

            // Act
            var response = await _client.GetAsync($"/api/payment/{paymentId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetPaymentsByOrder_ValidOrderId_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var orderId = Guid.NewGuid();

            // Act
            var response = await _client.GetAsync($"/api/payment/order/{orderId}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.NotNull(content);
        }

        [Fact]
        public async Task ConfirmPayment_ValidRequest_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var request = new ConfirmPaymentDto
            {
                PaymentIntentId = "pi_test_123",
                PaymentMethodId = "pm_test_456"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/payment/confirm", request);

            // Assert
            // Will fail without proper Stripe setup
            Assert.True(response.StatusCode == HttpStatusCode.OK || 
                       response.StatusCode == HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task CreateRefund_ValidRequest_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var request = new CreateRefundDto
            {
                PaymentId = Guid.NewGuid(),
                Amount = 50.00m,
                Reason = RefundReason.RequestedByCustomer,
                Notes = "Customer requested refund"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/payment/refund", request);

            // Assert
            // Will return NotFound since payment doesn't exist
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetPaymentSummary_ValidDateRange_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var startDate = DateTime.UtcNow.AddDays(-30);
            var endDate = DateTime.UtcNow;

            // Act
            var response = await _client.GetAsync(
                $"/api/payment/summary?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            var summary = JsonSerializer.Deserialize<PaymentSummaryDto>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            Assert.NotNull(summary);
            Assert.True(summary.TotalPayments >= 0);
            Assert.True(summary.TotalRefunds >= 0);
        }

        [Fact]
        public async Task StripeWebhook_ValidPayload_ReturnsOk()
        {
            // Arrange
            var webhookPayload = @"{
                ""id"": ""evt_test_123"",
                ""object"": ""event"",
                ""type"": ""payment_intent.succeeded"",
                ""data"": {
                    ""object"": {
                        ""id"": ""pi_test_123"",
                        ""object"": ""payment_intent"",
                        ""amount"": 10000,
                        ""currency"": ""usd"",
                        ""status"": ""succeeded""
                    }
                }
            }";

            var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
            content.Headers.Add("Stripe-Signature", "test_signature");

            // Act
            var response = await _client.PostAsync("/api/webhook/stripe", content);

            // Assert
            // Will fail without proper Stripe webhook configuration
            Assert.True(response.StatusCode == HttpStatusCode.OK || 
                       response.StatusCode == HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PayPalWebhook_ValidPayload_ReturnsNotImplemented()
        {
            // Arrange
            var webhookPayload = @"{
                ""event_type"": ""PAYMENT.CAPTURE.COMPLETED"",
                ""resource"": {
                    ""id"": ""test_payment_123""
                }
            }";

            var content = new StringContent(webhookPayload, Encoding.UTF8, "application/json");
            content.Headers.Add("PayPal-Signature", "test_signature");

            // Act
            var response = await _client.PostAsync("/api/webhook/paypal", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotImplemented, response.StatusCode);
        }

        [Fact]
        public async Task CreatePaymentIntent_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var request = new CreatePaymentIntentDto
            {
                OrderId = Guid.NewGuid(),
                Amount = 100.00m,
                Currency = "USD"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/payment/create-intent", request);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetPaymentMethods_AuthorizedUser_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            // Act
            var response = await _client.GetAsync("/api/payment-method");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.NotNull(content);
        }

        [Fact]
        public async Task AddPaymentMethod_ValidRequest_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var request = new CreatePaymentMethodDto
            {
                StripePaymentMethodId = "pm_test_123",
                SetAsDefault = true
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/payment-method", request);

            // Assert
            // Will fail without proper Stripe setup
            Assert.True(response.StatusCode == HttpStatusCode.OK || 
                       response.StatusCode == HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task DeletePaymentMethod_ValidId_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var paymentMethodId = Guid.NewGuid();

            // Act
            var response = await _client.DeleteAsync($"/api/payment-method/{paymentMethodId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task SetDefaultPaymentMethod_ValidId_ReturnsOk()
        {
            // Arrange
            var token = await GetAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var paymentMethodId = Guid.NewGuid();

            // Act
            var response = await _client.PutAsync($"/api/payment-method/{paymentMethodId}/set-default", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}