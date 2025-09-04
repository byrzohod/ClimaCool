using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ClimaCool.Application.DTOs.Auth;
using ClimaCool.Infrastructure.Data;

namespace ClimaCool.Tests.Integration.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real database context
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);
                
                // Also remove DbContextOptions<ApplicationDbContext> if it exists
                var optionsDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (optionsDescriptor != null)
                    services.Remove(optionsDescriptor);

                // Remove the ApplicationDbContext registration
                var contextDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(ApplicationDbContext));
                if (contextDescriptor != null)
                    services.Remove(contextDescriptor);

                // Add in-memory database for testing
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid());
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
    public async Task Register_WithValidRequest_ShouldReturnCreated()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = "test@example.com",
            Username = "testuser",
            Password = "Password123!",
            FirstName = "Test",
            LastName = "User"
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/register", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var responseContent = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(responseContent, _jsonOptions);

        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
        authResponse.User.Should().NotBeNull();
        authResponse.User.Email.Should().Be(request.Email.ToLower());
        authResponse.User.Username.Should().Be(request.Username.ToLower());
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        // Arrange - First registration
        var request1 = new RegisterRequestDto
        {
            Email = "duplicate@example.com",
            Username = "user1",
            Password = "Password123!",
            FirstName = "User",
            LastName = "One"
        };

        var json1 = JsonSerializer.Serialize(request1, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(json1, Encoding.UTF8, "application/json"));

        // Arrange - Second registration with same email
        var request2 = new RegisterRequestDto
        {
            Email = "duplicate@example.com", // Same email
            Username = "user2",
            Password = "Password123!",
            FirstName = "User",
            LastName = "Two"
        };

        var json2 = JsonSerializer.Serialize(request2, _jsonOptions);
        var stringContent2 = new StringContent(json2, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/register", stringContent2);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("already registered");
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
            FirstName = "",         // Empty first name
            LastName = ""           // Empty last name
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/register", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnOk()
    {
        // Arrange - First register a user
        var registerRequest = new RegisterRequestDto
        {
            Email = "login@example.com",
            Username = "loginuser",
            Password = "Password123!",
            FirstName = "Login",
            LastName = "User"
        };

        var registerJson = JsonSerializer.Serialize(registerRequest, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(registerJson, Encoding.UTF8, "application/json"));

        // Verify email (in real scenario, this would be done via email link)
        // For testing, we'll manually verify the user in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == registerRequest.Email.ToLower());
        if (user != null)
        {
            user.EmailVerified = true;
            await context.SaveChangesAsync();
        }

        // Arrange - Login request
        var loginRequest = new LoginRequestDto
        {
            EmailOrUsername = registerRequest.Email,
            Password = registerRequest.Password
        };

        var loginJson = JsonSerializer.Serialize(loginRequest, _jsonOptions);
        var stringContent = new StringContent(loginJson, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/login", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(responseContent, _jsonOptions);

        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
        authResponse.User.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequestDto
        {
            EmailOrUsername = "nonexistent@example.com",
            Password = "WrongPassword123!"
        };

        var json = JsonSerializer.Serialize(loginRequest, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/login", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithUnverifiedEmail_ShouldReturnUnauthorized()
    {
        // Arrange - Register but don't verify email
        var registerRequest = new RegisterRequestDto
        {
            Email = "unverified@example.com",
            Username = "unverifieduser",
            Password = "Password123!",
            FirstName = "Unverified",
            LastName = "User"
        };

        var registerJson = JsonSerializer.Serialize(registerRequest, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(registerJson, Encoding.UTF8, "application/json"));

        // Arrange - Try to login without email verification
        var loginRequest = new LoginRequestDto
        {
            EmailOrUsername = registerRequest.Email,
            Password = registerRequest.Password
        };

        var loginJson = JsonSerializer.Serialize(loginRequest, _jsonOptions);
        var stringContent = new StringContent(loginJson, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/login", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("not verified");
    }

    [Fact]
    public async Task VerifyEmail_WithValidToken_ShouldReturnOk()
    {
        // Arrange - Register a user
        var registerRequest = new RegisterRequestDto
        {
            Email = "verify@example.com",
            Username = "verifyuser",
            Password = "Password123!",
            FirstName = "Verify",
            LastName = "User"
        };

        var registerJson = JsonSerializer.Serialize(registerRequest, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(registerJson, Encoding.UTF8, "application/json"));

        // Get the verification token from database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == registerRequest.Email.ToLower());
        var verificationToken = user?.EmailVerificationToken;

        // Arrange - Verification request
        var verifyRequest = new VerifyEmailRequestDto
        {
            Token = verificationToken!
        };

        var json = JsonSerializer.Serialize(verifyRequest, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/verify-email", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("verified successfully");
    }

    [Fact]
    public async Task VerifyEmail_WithInvalidToken_ShouldReturnBadRequest()
    {
        // Arrange
        var verifyRequest = new VerifyEmailRequestDto
        {
            Token = "invalid-token"
        };

        var json = JsonSerializer.Serialize(verifyRequest, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/verify-email", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ForgotPassword_WithValidEmail_ShouldReturnOk()
    {
        // Arrange - Register and verify a user first
        var registerRequest = new RegisterRequestDto
        {
            Email = "forgot@example.com",
            Username = "forgotuser",
            Password = "Password123!",
            FirstName = "Forgot",
            LastName = "User"
        };

        var registerJson = JsonSerializer.Serialize(registerRequest, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(registerJson, Encoding.UTF8, "application/json"));

        // Verify email
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == registerRequest.Email.ToLower());
        if (user != null)
        {
            user.EmailVerified = true;
            await context.SaveChangesAsync();
        }

        // Arrange - Forgot password request
        var forgotRequest = new ForgotPasswordRequestDto
        {
            Email = registerRequest.Email
        };

        var json = JsonSerializer.Serialize(forgotRequest, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/forgot-password", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("password reset link");
    }

    [Fact]
    public async Task ForgotPassword_WithNonExistentEmail_ShouldReturnOk()
    {
        // Arrange - This should still return OK to prevent email enumeration
        var forgotRequest = new ForgotPasswordRequestDto
        {
            Email = "nonexistent@example.com"
        };

        var json = JsonSerializer.Serialize(forgotRequest, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/forgot-password", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
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
    public async Task Me_WithValidToken_ShouldReturnUserInfo()
    {
        // Arrange - Register and login to get token
        var registerRequest = new RegisterRequestDto
        {
            Email = "me@example.com",
            Username = "meuser",
            Password = "Password123!",
            FirstName = "Me",
            LastName = "User"
        };

        var registerJson = JsonSerializer.Serialize(registerRequest, _jsonOptions);
        await _client.PostAsync("/api/auth/register", new StringContent(registerJson, Encoding.UTF8, "application/json"));

        // Verify email
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == registerRequest.Email.ToLower());
        if (user != null)
        {
            user.EmailVerified = true;
            await context.SaveChangesAsync();
        }

        // Login to get token
        var loginRequest = new LoginRequestDto
        {
            EmailOrUsername = registerRequest.Email,
            Password = registerRequest.Password
        };

        var loginJson = JsonSerializer.Serialize(loginRequest, _jsonOptions);
        var loginResponse = await _client.PostAsync("/api/auth/login", 
            new StringContent(loginJson, Encoding.UTF8, "application/json"));

        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginContent, _jsonOptions);

        // Add Authorization header
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var userDto = JsonSerializer.Deserialize<UserDto>(responseContent, _jsonOptions);

        userDto.Should().NotBeNull();
        userDto!.Email.Should().Be(registerRequest.Email.ToLower());
        userDto.Username.Should().Be(registerRequest.Username.ToLower());
    }

    [Theory]
    [InlineData("", "testuser", "Password123!", "Test", "User")]
    [InlineData("invalid-email", "testuser", "Password123!", "Test", "User")]
    [InlineData("test@example.com", "", "Password123!", "Test", "User")]
    [InlineData("test@example.com", "testuser", "weak", "Test", "User")]
    [InlineData("test@example.com", "testuser", "Password123!", "", "User")]
    [InlineData("test@example.com", "testuser", "Password123!", "Test", "")]
    public async Task Register_WithInvalidFields_ShouldReturnBadRequest(
        string email, string username, string password, string firstName, string lastName)
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = email,
            Username = username,
            Password = password,
            FirstName = firstName,
            LastName = lastName
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var stringContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/auth/register", stringContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}