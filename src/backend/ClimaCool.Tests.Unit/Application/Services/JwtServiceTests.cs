using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Tests.Unit.Application.Services;

public class JwtServiceTests
{
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<JwtService>> _loggerMock;
    private readonly JwtService _jwtService;
    private readonly User _testUser;

    public JwtServiceTests()
    {
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<JwtService>>();

        // Setup configuration values
        _configurationMock.Setup(x => x["JWT:Secret"]).Returns("ThisIsATestSecretKeyForJWTTokenGenerationAtLeast256BitsLong!@#$%^&*()");
        _configurationMock.Setup(x => x["JWT:Issuer"]).Returns("ClimaCoolTest");
        _configurationMock.Setup(x => x["JWT:Audience"]).Returns("ClimaCoolTestUsers");
        _configurationMock.Setup(x => x["JWT:AccessTokenExpirationMinutes"]).Returns("15");
        _configurationMock.Setup(x => x["JWT:RefreshTokenExpirationDays"]).Returns("7");

        _jwtService = new JwtService(_configurationMock.Object, _loggerMock.Object);

        _testUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            FirstName = "Test",
            LastName = "User"
        };
    }

    [Fact]
    public void GenerateAccessToken_WithValidUser_ShouldReturnValidJwtToken()
    {
        var roles = new List<string> { "Customer" };

        var token = _jwtService.GenerateAccessToken(_testUser, roles);

        token.Should().NotBeNullOrEmpty();
        
        // Verify it's a valid JWT token format
        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(token);
        
        jsonToken.Should().NotBeNull();
        jsonToken.Issuer.Should().Be("ClimaCoolTest");
        jsonToken.Audiences.Should().Contain("ClimaCoolTestUsers");
    }

    [Fact]
    public void GenerateAccessToken_ShouldIncludeRequiredClaims()
    {
        var roles = new List<string> { "Customer", "Admin" };

        var token = _jwtService.GenerateAccessToken(_testUser, roles);

        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(token);
        
        // Check required claims
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == _testUser.Id.ToString());
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == _testUser.Email);
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == _testUser.Username);
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.GivenName && c.Value == _testUser.FirstName);
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Surname && c.Value == _testUser.LastName);
        
        // Check role claims
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Customer");
        jsonToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Admin");
    }

    [Fact]
    public void GenerateAccessToken_ShouldSetCorrectExpiration()
    {
        var roles = new List<string> { "Customer" };

        var token = _jwtService.GenerateAccessToken(_testUser, roles);

        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(token);
        
        var expectedExpiry = DateTime.UtcNow.AddMinutes(15);
        jsonToken.ValidTo.Should().BeCloseTo(expectedExpiry, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateAccessToken_WithEmptyRoles_ShouldNotIncludeRoleClaims()
    {
        var roles = new List<string>();

        var token = _jwtService.GenerateAccessToken(_testUser, roles);

        var handler = new JwtSecurityTokenHandler();
        var jsonToken = handler.ReadJwtToken(token);
        
        jsonToken.Claims.Should().NotContain(c => c.Type == ClaimTypes.Role);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnNonEmptyToken()
    {
        var refreshToken = _jwtService.GenerateRefreshToken();

        refreshToken.Should().NotBeNullOrEmpty();
        refreshToken.Should().HaveLength(43); // Base64 encoded 32 bytes without padding
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnUniqueTokens()
    {
        var token1 = _jwtService.GenerateRefreshToken();
        var token2 = _jwtService.GenerateRefreshToken();

        token1.Should().NotBe(token2);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldNotContainUrlUnsafeCharacters()
    {
        var refreshToken = _jwtService.GenerateRefreshToken();

        refreshToken.Should().NotContain("+");
        refreshToken.Should().NotContain("/");
        refreshToken.Should().NotContain("=");
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_WithValidExpiredToken_ShouldReturnClaimsPrincipal()
    {
        var roles = new List<string> { "Customer" };
        var token = _jwtService.GenerateAccessToken(_testUser, roles);
        
        // Wait a moment to ensure token validation
        Thread.Sleep(100);

        var principal = _jwtService.GetPrincipalFromExpiredToken(token);

        principal.Should().NotBeNull();
        principal.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == _testUser.Id.ToString());
        principal.Claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == _testUser.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid-token")]
    [InlineData("Bearer invalid-token")]
    [InlineData("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature")]
    public void GetPrincipalFromExpiredToken_WithInvalidToken_ShouldReturnNull(string invalidToken)
    {
        var principal = _jwtService.GetPrincipalFromExpiredToken(invalidToken);

        principal.Should().BeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_WithNullToken_ShouldReturnNull()
    {
        var principal = _jwtService.GetPrincipalFromExpiredToken(null!);

        principal.Should().BeNull();
    }

    [Fact]
    public void GenerateAccessToken_WithNullUser_ShouldThrowArgumentNullException()
    {
        var roles = new List<string> { "Customer" };

        Assert.Throws<ArgumentNullException>(() => _jwtService.GenerateAccessToken(null!, roles));
    }

    [Fact]
    public void GenerateAccessToken_WithNullRoles_ShouldThrowArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => _jwtService.GenerateAccessToken(_testUser, null!));
    }

    [Fact]
    public void Constructor_WithInvalidSecretKey_ShouldThrowException()
    {
        var invalidConfig = new Mock<IConfiguration>();
        invalidConfig.Setup(x => x["JWT:Secret"]).Returns("short"); // Too short for security

        Assert.Throws<ArgumentException>(() => new JwtService(invalidConfig.Object, _loggerMock.Object));
    }

    [Theory]
    [InlineData("JWT:Secret")]
    [InlineData("JWT:Issuer")]
    [InlineData("JWT:Audience")]
    [InlineData("JWT:AccessTokenExpirationMinutes")]
    [InlineData("JWT:RefreshTokenExpirationDays")]
    public void Constructor_WithMissingConfiguration_ShouldThrowException(string missingKey)
    {
        var invalidConfig = new Mock<IConfiguration>();
        
        // Set all config values except the one we're testing
        if (missingKey != "JWT:Secret")
            invalidConfig.Setup(x => x["JWT:Secret"]).Returns("ThisIsATestSecretKeyForJWTTokenGenerationAtLeast256BitsLong!@#$%^&*()");
        if (missingKey != "JWT:Issuer")
            invalidConfig.Setup(x => x["JWT:Issuer"]).Returns("ClimaCoolTest");
        if (missingKey != "JWT:Audience")
            invalidConfig.Setup(x => x["JWT:Audience"]).Returns("ClimaCoolTestUsers");
        if (missingKey != "JWT:AccessTokenExpirationMinutes")
            invalidConfig.Setup(x => x["JWT:AccessTokenExpirationMinutes"]).Returns("15");
        if (missingKey != "JWT:RefreshTokenExpirationDays")
            invalidConfig.Setup(x => x["JWT:RefreshTokenExpirationDays"]).Returns("7");

        Assert.Throws<ArgumentException>(() => new JwtService(invalidConfig.Object, _loggerMock.Object));
    }
}