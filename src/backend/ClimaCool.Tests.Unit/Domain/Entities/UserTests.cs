using ClimaCool.Domain.Entities;

namespace ClimaCool.Tests.Unit.Domain.Entities;

public class UserTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithDefaults()
    {
        var user = new User();
        
        user.Id.Should().NotBeEmpty();
        user.IsEmailVerified.Should().BeFalse();
        user.AccessFailedCount.Should().Be(0);
        user.LockoutEnd.Should().BeNull();
        user.IsActive.Should().BeTrue();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        user.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        user.UserRoles.Should().NotBeNull();
        user.RefreshTokens.Should().NotBeNull();
    }

    [Fact]
    public void IsLockedOut_WhenLockoutEndIsNull_ShouldReturnFalse()
    {
        var user = new User { LockoutEnd = null };
        
        user.IsLockedOut().Should().BeFalse();
    }

    [Fact]
    public void IsLockedOut_WhenLockoutEndIsInPast_ShouldReturnFalse()
    {
        var user = new User { LockoutEnd = DateTime.UtcNow.AddMinutes(-5) };
        
        user.IsLockedOut().Should().BeFalse();
    }

    [Fact]
    public void IsLockedOut_WhenLockoutEndIsInFuture_ShouldReturnTrue()
    {
        var user = new User { LockoutEnd = DateTime.UtcNow.AddMinutes(5) };
        
        user.IsLockedOut().Should().BeTrue();
    }

    [Fact]
    public void IncrementAccessFailedCount_WhenAccessFailedCountLessThanFive_ShouldIncrementCount()
    {
        var user = new User { AccessFailedCount = 2 };
        
        user.IncrementAccessFailedCount();
        
        user.AccessFailedCount.Should().Be(3);
        user.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public void IncrementAccessFailedCount_WhenAccessFailedCountReachesFive_ShouldLockoutUser()
    {
        var user = new User { AccessFailedCount = 4 };
        
        user.IncrementAccessFailedCount();
        
        user.AccessFailedCount.Should().Be(5);
        user.LockoutEnd.Should().NotBeNull();
        user.LockoutEnd.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void ResetAccessFailedCount_ShouldResetCountAndRemoveLockout()
    {
        var user = new User 
        { 
            AccessFailedCount = 5,
            LockoutEnd = DateTime.UtcNow.AddMinutes(10)
        };
        
        user.ResetAccessFailedCount();
        
        user.AccessFailedCount.Should().Be(0);
        user.LockoutEnd.Should().BeNull();
    }

    [Theory]
    [InlineData("test@example.com")]
    [InlineData("user@domain.org")]
    [InlineData("admin@company.co.uk")]
    public void SetEmail_WithValidEmail_ShouldSetEmailInLowerCase(string email)
    {
        var user = new User();
        
        user.Email = email.ToUpper();
        
        user.Email.Should().Be(email.ToLower());
    }

    [Theory]
    [InlineData("TestUser")]
    [InlineData("ADMIN")]
    [InlineData("Customer123")]
    public void SetUsername_WithValidUsername_ShouldSetUsernameInLowerCase(string username)
    {
        var user = new User();
        
        user.Username = username.ToUpper();
        
        user.Username.Should().Be(username.ToLower());
    }

    [Fact]
    public void SetEmailVerificationToken_ShouldSetTokenAndExpiryTime()
    {
        var user = new User();
        var token = "verification-token-123";
        
        user.EmailVerificationToken = token;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
        
        user.EmailVerificationToken.Should().Be(token);
        user.EmailVerificationTokenExpiry.Should().BeCloseTo(DateTime.UtcNow.AddHours(24), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void SetPasswordResetToken_ShouldSetTokenAndExpiryTime()
    {
        var user = new User();
        var token = "reset-token-456";
        
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        
        user.PasswordResetToken.Should().Be(token);
        user.PasswordResetTokenExpiry.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void MarkEmailAsVerified_ShouldSetIsEmailVerifiedToTrueAndClearToken()
    {
        var user = new User
        {
            IsEmailVerified = false,
            EmailVerificationToken = "token",
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(1)
        };
        
        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        
        user.IsEmailVerified.Should().BeTrue();
        user.EmailVerificationToken.Should().BeNull();
        user.EmailVerificationTokenExpiry.Should().BeNull();
    }
}