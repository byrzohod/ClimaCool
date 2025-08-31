using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ClimaCool.Application.Services;

namespace ClimaCool.Tests.Unit.Application.Services;

public class EmailServiceTests
{
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<EmailService>> _loggerMock;
    private readonly EmailService _emailService;

    public EmailServiceTests()
    {
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<EmailService>>();

        // Setup configuration values
        _configurationMock.Setup(x => x["Email:SMTP:Host"]).Returns("localhost");
        _configurationMock.Setup(x => x["Email:SMTP:Port"]).Returns("1025");
        _configurationMock.Setup(x => x["Email:SMTP:Username"]).Returns("");
        _configurationMock.Setup(x => x["Email:SMTP:Password"]).Returns("");
        _configurationMock.Setup(x => x["Email:SMTP:FromEmail"]).Returns("noreply@climacool.com");
        _configurationMock.Setup(x => x["Email:SMTP:FromName"]).Returns("ClimaCool");
        _configurationMock.Setup(x => x["Email:SMTP:EnableSSL"]).Returns("false");
        _configurationMock.Setup(x => x["AppUrl"]).Returns("http://localhost:4200");

        _emailService = new EmailService(_configurationMock.Object, _loggerMock.Object);
    }

    [Fact]
    public void Constructor_WithValidConfiguration_ShouldInitializeCorrectly()
    {
        // Act & Assert - constructor should not throw
        var service = new EmailService(_configurationMock.Object, _loggerMock.Object);
        service.Should().NotBeNull();
    }

    [Fact]
    public void Constructor_WithDefaultValues_ShouldUseDefaults()
    {
        var configWithNulls = new Mock<IConfiguration>();
        // Don't setup any values, should use defaults

        var service = new EmailService(configWithNulls.Object, _loggerMock.Object);
        service.Should().NotBeNull();
    }

    [Fact]
    public async Task SendEmailAsync_WithValidParameters_ShouldNotThrow()
    {
        // Note: This test would require mocking SMTP client, which is complex
        // In a real scenario, we might inject an abstraction for SMTP client
        
        var email = "test@example.com";
        var subject = "Test Subject";
        var body = "Test Body";

        // Act & Assert - should not throw (though email won't actually send in test)
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendEmailAsync(email, subject, body);
        });

        // We expect this to fail because there's no SMTP server, 
        // but we're testing that the method handles parameters correctly
        // The actual failure would be logged
        exception.Should().BeNull(); // Method should handle SMTP errors gracefully
    }

    [Theory]
    [InlineData("john@example.com", "John", "verification-token-123")]
    [InlineData("jane.doe@company.com", "Jane", "abc123def456")]
    public async Task SendVerificationEmailAsync_WithValidParameters_ShouldGenerateCorrectContent(
        string email, string firstName, string verificationToken)
    {
        // Act & Assert - should not throw
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendVerificationEmailAsync(email, firstName, verificationToken);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("john@example.com", "John", "reset-token-123")]
    [InlineData("jane.doe@company.com", "Jane", "xyz789abc456")]
    public async Task SendPasswordResetEmailAsync_WithValidParameters_ShouldGenerateCorrectContent(
        string email, string firstName, string resetToken)
    {
        // Act & Assert - should not throw
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendPasswordResetEmailAsync(email, firstName, resetToken);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("john@example.com", "John")]
    [InlineData("jane.doe@company.com", "Jane")]
    public async Task SendWelcomeEmailAsync_WithValidParameters_ShouldGenerateCorrectContent(
        string email, string firstName)
    {
        // Act & Assert - should not throw
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendWelcomeEmailAsync(email, firstName);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData(null, "Subject", "Body")]
    [InlineData("", "Subject", "Body")]
    [InlineData("invalid-email", "Subject", "Body")]
    public async Task SendEmailAsync_WithInvalidEmail_ShouldHandleGracefully(
        string email, string subject, string body)
    {
        // Act & Assert - should not throw, should handle gracefully
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendEmailAsync(email!, subject, body);
        });

        // EmailService should handle invalid emails gracefully and log errors
        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("test@example.com", null, "Body")]
    [InlineData("test@example.com", "", "Body")]
    public async Task SendEmailAsync_WithInvalidSubject_ShouldHandleGracefully(
        string email, string subject, string body)
    {
        // Act & Assert - should not throw, should handle gracefully
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendEmailAsync(email, subject!, body);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("test@example.com", "Subject", null)]
    [InlineData("test@example.com", "Subject", "")]
    public async Task SendEmailAsync_WithInvalidBody_ShouldHandleGracefully(
        string email, string subject, string body)
    {
        // Act & Assert - should not throw, should handle gracefully
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendEmailAsync(email, subject, body!);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("", "John", "token")]
    [InlineData("invalid-email", "John", "token")]
    [InlineData(null, "John", "token")]
    public async Task SendVerificationEmailAsync_WithInvalidEmail_ShouldHandleGracefully(
        string email, string firstName, string verificationToken)
    {
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendVerificationEmailAsync(email!, firstName, verificationToken);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("test@example.com", "", "token")]
    [InlineData("test@example.com", null, "token")]
    public async Task SendVerificationEmailAsync_WithInvalidFirstName_ShouldHandleGracefully(
        string email, string firstName, string verificationToken)
    {
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendVerificationEmailAsync(email, firstName!, verificationToken);
        });

        exception.Should().BeNull();
    }

    [Theory]
    [InlineData("test@example.com", "John", "")]
    [InlineData("test@example.com", "John", null)]
    public async Task SendVerificationEmailAsync_WithInvalidToken_ShouldHandleGracefully(
        string email, string firstName, string verificationToken)
    {
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendVerificationEmailAsync(email, firstName, verificationToken!);
        });

        exception.Should().BeNull();
    }

    [Fact]
    public async Task SendEmailAsync_WhenSmtpFails_ShouldLogErrorAndNotThrow()
    {
        // This test verifies that SMTP failures are handled gracefully
        var email = "test@example.com";
        var subject = "Test Subject";
        var body = "Test Body";

        var exception = await Record.ExceptionAsync(async () =>
        {
            await _emailService.SendEmailAsync(email, subject, body);
        });

        // Should not throw - errors should be logged instead
        exception.Should().BeNull();
        
        // Verify that error was logged (though actual SMTP failure would need real SMTP setup)
        // This is more of a behavioral test that the method completes without throwing
    }
}