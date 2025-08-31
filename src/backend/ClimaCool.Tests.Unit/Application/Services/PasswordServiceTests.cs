using ClimaCool.Application.Services;

namespace ClimaCool.Tests.Unit.Application.Services;

public class PasswordServiceTests
{
    private readonly PasswordService _passwordService;

    public PasswordServiceTests()
    {
        _passwordService = new PasswordService();
    }

    [Theory]
    [InlineData("password123")]
    [InlineData("MySecurePassword!@#")]
    [InlineData("simple")]
    [InlineData("ComplexPassword123!@#")]
    public void HashPassword_WithValidPassword_ShouldReturnHashedPassword(string password)
    {
        var hashedPassword = _passwordService.HashPassword(password);
        
        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
        hashedPassword.Should().StartWith("$2a$"); // BCrypt hash starts with this
    }

    [Theory]
    [InlineData("password123")]
    [InlineData("MySecurePassword!@#")]
    [InlineData("simple")]
    public void HashPassword_WithSamePassword_ShouldReturnDifferentHashes(string password)
    {
        var hash1 = _passwordService.HashPassword(password);
        var hash2 = _passwordService.HashPassword(password);
        
        hash1.Should().NotBe(hash2); // BCrypt includes salt, so hashes should be different
    }

    [Theory]
    [InlineData("password123")]
    [InlineData("MySecurePassword!@#")]
    [InlineData("simple")]
    [InlineData("ComplexPassword123!@#")]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue(string password)
    {
        var hashedPassword = _passwordService.HashPassword(password);
        
        var result = _passwordService.VerifyPassword(password, hashedPassword);
        
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("password123", "wrongpassword")]
    [InlineData("MySecurePassword!@#", "DifferentPassword")]
    [InlineData("simple", "complex")]
    public void VerifyPassword_WithIncorrectPassword_ShouldReturnFalse(string correctPassword, string wrongPassword)
    {
        var hashedPassword = _passwordService.HashPassword(correctPassword);
        
        var result = _passwordService.VerifyPassword(wrongPassword, hashedPassword);
        
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_WithInvalidHash_ShouldReturnFalse()
    {
        var password = "password123";
        var invalidHash = "invalid-hash-format";
        
        var result = _passwordService.VerifyPassword(password, invalidHash);
        
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_WithNullPassword_ShouldReturnFalse()
    {
        var hashedPassword = _passwordService.HashPassword("password123");
        
        var result = _passwordService.VerifyPassword(null!, hashedPassword);
        
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_WithNullHash_ShouldReturnFalse()
    {
        var password = "password123";
        
        var result = _passwordService.VerifyPassword(password, null!);
        
        result.Should().BeFalse();
    }

    [Fact]
    public void GenerateResetToken_ShouldReturnNonEmptyToken()
    {
        var token = _passwordService.GenerateResetToken();
        
        token.Should().NotBeNullOrEmpty();
        token.Should().HaveLength(43); // Base64 encoded 32 bytes without padding = 43 chars
    }

    [Fact]
    public void GenerateResetToken_ShouldReturnUniqueTokens()
    {
        var token1 = _passwordService.GenerateResetToken();
        var token2 = _passwordService.GenerateResetToken();
        
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void GenerateVerificationToken_ShouldReturnNonEmptyToken()
    {
        var token = _passwordService.GenerateVerificationToken();
        
        token.Should().NotBeNullOrEmpty();
        token.Should().HaveLength(43); // Base64 encoded 32 bytes without padding = 43 chars
    }

    [Fact]
    public void GenerateVerificationToken_ShouldReturnUniqueTokens()
    {
        var token1 = _passwordService.GenerateVerificationToken();
        var token2 = _passwordService.GenerateVerificationToken();
        
        token1.Should().NotBe(token2);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void HashPassword_WithEmptyOrWhitespacePassword_ShouldThrowException(string password)
    {
        Assert.Throws<ArgumentException>(() => _passwordService.HashPassword(password));
    }

    [Fact]
    public void HashPassword_WithNullPassword_ShouldThrowException()
    {
        Assert.Throws<ArgumentNullException>(() => _passwordService.HashPassword(null!));
    }

    [Fact]
    public void GeneratedTokens_ShouldNotContainUrlUnsafeCharacters()
    {
        var resetToken = _passwordService.GenerateResetToken();
        var verificationToken = _passwordService.GenerateVerificationToken();
        
        // Tokens should not contain URL-unsafe characters like +, /, =
        resetToken.Should().NotContain("+");
        resetToken.Should().NotContain("/");
        resetToken.Should().NotContain("=");
        
        verificationToken.Should().NotContain("+");
        verificationToken.Should().NotContain("/");
        verificationToken.Should().NotContain("=");
    }

    [Fact]
    public void GeneratedTokens_ShouldOnlyContainValidBase64UrlCharacters()
    {
        var resetToken = _passwordService.GenerateResetToken();
        var verificationToken = _passwordService.GenerateVerificationToken();
        
        // Should only contain: A-Z, a-z, 0-9, -, _
        var validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        
        foreach (char c in resetToken)
        {
            validChars.Should().Contain(c);
        }
        
        foreach (char c in verificationToken)
        {
            validChars.Should().Contain(c);
        }
    }
}