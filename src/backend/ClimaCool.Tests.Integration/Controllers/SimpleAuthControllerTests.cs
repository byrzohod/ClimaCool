using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using ClimaCool.Application.DTOs.Auth;

namespace ClimaCool.Tests.Integration.Controllers;

public class SimpleAuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public SimpleAuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new[]
                {
                    new KeyValuePair<string, string?>("ConnectionStrings:DefaultConnection", "Server=inmemory"),
                    new KeyValuePair<string, string?>("JWT:Secret", "ThisIsATestSecretKeyForJWTTokenGenerationAtLeast256BitsLong!@#$%^&*()"),
                    new KeyValuePair<string, string?>("JWT:Issuer", "ClimaCoolTest"),
                    new KeyValuePair<string, string?>("JWT:Audience", "ClimaCoolTestUsers"),
                    new KeyValuePair<string, string?>("JWT:AccessTokenExpirationMinutes", "15"),
                    new KeyValuePair<string, string?>("JWT:RefreshTokenExpirationDays", "7"),
                });
            });
        });

        _client = _factory.CreateClient();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    [Fact]
    public async Task Health_ShouldReturnOk()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact] 
    public async Task Me_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithInvalidData_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = "invalid-email", // Invalid email format
            Username = "",          // Empty username
            Password = "weak",      // Weak password
            ConfirmPassword = "different", // Password mismatch
            FirstName = "",         // Empty first name
            LastName = ""           // Empty last name
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/register", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("validation errors");
    }

    [Fact]
    public async Task Login_WithInvalidData_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "", // Empty email/username
            Password = ""         // Empty password
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/login", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ForgotPassword_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new ForgotPasswordRequestDto
        {
            Email = "invalid-email" // Invalid email format
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/forgot-password", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task VerifyEmail_WithInvalidToken_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new VerifyEmailRequestDto
        {
            Token = "" // Empty token
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/verify-email", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RefreshToken_WithInvalidData_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RefreshTokenRequestDto
        {
            RefreshToken = "" // Empty refresh token
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/refresh", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}