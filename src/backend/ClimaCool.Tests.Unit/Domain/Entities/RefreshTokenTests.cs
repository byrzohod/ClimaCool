using ClimaCool.Domain.Entities;

namespace ClimaCool.Tests.Unit.Domain.Entities;

public class RefreshTokenTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithDefaults()
    {
        var refreshToken = new RefreshToken();
        
        refreshToken.Id.Should().NotBeEmpty();
        refreshToken.IsRevoked.Should().BeFalse();
        refreshToken.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        refreshToken.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void IsExpired_WhenExpiresAtIsInFuture_ShouldReturnFalse()
    {
        var refreshToken = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        
        refreshToken.IsExpired.Should().BeFalse();
    }

    [Fact]
    public void IsExpired_WhenExpiresAtIsInPast_ShouldReturnTrue()
    {
        var refreshToken = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(-1)
        };
        
        refreshToken.IsExpired.Should().BeTrue();
    }

    [Fact]
    public void IsActive_WhenNotRevokedAndNotExpired_ShouldReturnTrue()
    {
        var refreshToken = new RefreshToken
        {
            IsRevoked = false,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        
        refreshToken.IsActive.Should().BeTrue();
    }

    [Fact]
    public void IsActive_WhenRevoked_ShouldReturnFalse()
    {
        var refreshToken = new RefreshToken
        {
            IsRevoked = true,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        
        refreshToken.IsActive.Should().BeFalse();
    }

    [Fact]
    public void IsActive_WhenExpired_ShouldReturnFalse()
    {
        var refreshToken = new RefreshToken
        {
            IsRevoked = false,
            ExpiresAt = DateTime.UtcNow.AddDays(-1)
        };
        
        refreshToken.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Revoke_ShouldSetIsRevokedToTrue()
    {
        var refreshToken = new RefreshToken { IsRevoked = false };
        
        refreshToken.IsRevoked = true;
        refreshToken.RevokedAt = DateTime.UtcNow;
        
        refreshToken.IsRevoked.Should().BeTrue();
        refreshToken.RevokedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void SetUser_ShouldSetUserIdAndUserNavigation()
    {
        var user = new User { Id = Guid.NewGuid(), Email = "test@example.com" };
        var refreshToken = new RefreshToken();
        
        refreshToken.UserId = user.Id;
        refreshToken.User = user;
        
        refreshToken.UserId.Should().Be(user.Id);
        refreshToken.User.Should().Be(user);
    }
}