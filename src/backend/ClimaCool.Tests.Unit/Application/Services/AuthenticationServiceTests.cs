using Microsoft.Extensions.Logging;
using ClimaCool.Application.DTOs.Auth;
using ClimaCool.Application.Interfaces;
using ClimaCool.Application.Services;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;

namespace ClimaCool.Tests.Unit.Application.Services;

public class AuthenticationServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IRepository<Role>> _roleRepositoryMock;
    private readonly Mock<IRepository<RefreshToken>> _refreshTokenRepositoryMock;
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<AuthenticationService>> _loggerMock;
    private readonly AuthenticationService _authenticationService;

    public AuthenticationServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _roleRepositoryMock = new Mock<IRepository<Role>>();
        _refreshTokenRepositoryMock = new Mock<IRepository<RefreshToken>>();
        _passwordServiceMock = new Mock<IPasswordService>();
        _jwtServiceMock = new Mock<IJwtService>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<AuthenticationService>>();

        // Setup UnitOfWork to return our mocked repositories
        _unitOfWorkMock.Setup(x => x.Users).Returns(_userRepositoryMock.Object);
        _unitOfWorkMock.Setup(x => x.Roles).Returns(_roleRepositoryMock.Object);
        _unitOfWorkMock.Setup(x => x.RefreshTokens).Returns(_refreshTokenRepositoryMock.Object);

        _authenticationService = new AuthenticationService(
            _unitOfWorkMock.Object,
            _passwordServiceMock.Object,
            _jwtServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object
        );
    }

    [Fact]
    public async Task RegisterAsync_WithValidRequest_ShouldCreateUserAndReturnAuthResponse()
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

        var customerRole = new Role { Id = Guid.NewGuid(), Name = "Customer" };
        var hashedPassword = "hashed-password";
        var verificationToken = "verification-token";
        var accessToken = "access-token";
        var refreshTokenValue = "refresh-token";

        // Setup mocks
        _userRepositoryMock.Setup(x => x.IsEmailUniqueAsync(request.Email, null))
            .ReturnsAsync(true);
        _userRepositoryMock.Setup(x => x.IsUsernameUniqueAsync(request.Username, null))
            .ReturnsAsync(true);
        _roleRepositoryMock.Setup(x => x.SingleOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<Role, bool>>>()))
            .ReturnsAsync(customerRole);
        _passwordServiceMock.Setup(x => x.HashPassword(request.Password))
            .Returns(hashedPassword);
        _passwordServiceMock.Setup(x => x.GenerateVerificationToken())
            .Returns(verificationToken);
        _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>()))
            .Returns(accessToken);
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns(refreshTokenValue);
        _userRepositoryMock.Setup(x => x.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);
        _unitOfWorkMock.Setup(x => x.CompleteAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _authenticationService.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be(accessToken);
        result.RefreshToken.Should().Be(refreshTokenValue);
        result.User.Should().NotBeNull();
        result.User.Email.Should().Be(request.Email.ToLower());
        result.User.Username.Should().Be(request.Username.ToLower());

        // Verify mocks
        _userRepositoryMock.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
        _passwordServiceMock.Verify(x => x.HashPassword(request.Password), Times.Once);
        _emailServiceMock.Verify(x => x.SendVerificationEmailAsync(
            request.Email, request.FirstName, verificationToken), Times.Once);
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = "existing@example.com",
            Username = "testuser",
            Password = "Password123!",
            FirstName = "Test",
            LastName = "User"
        };

        _userRepositoryMock.Setup(x => x.IsEmailUniqueAsync(request.Email, null))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authenticationService.RegisterAsync(request));

        exception.Message.Should().Contain("Email is already registered");
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            Email = "test@example.com",
            Username = "existinguser",
            Password = "Password123!",
            FirstName = "Test",
            LastName = "User"
        };

        _userRepositoryMock.Setup(x => x.IsEmailUniqueAsync(request.Email, null))
            .ReturnsAsync(true);
        _userRepositoryMock.Setup(x => x.IsUsernameUniqueAsync(request.Username, null))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authenticationService.RegisterAsync(request));

        exception.Message.Should().Contain("Username is already taken");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnAuthResponse()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "test@example.com",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            IsEmailVerified = true,
            IsActive = true,
            AccessFailedCount = 0
        };

        var accessToken = "access-token";
        var refreshTokenValue = "refresh-token";

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync(user);
        _passwordServiceMock.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash))
            .Returns(true);
        _jwtServiceMock.Setup(x => x.GenerateAccessToken(user, It.IsAny<List<string>>()))
            .Returns(accessToken);
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
            .Returns(refreshTokenValue);
        _unitOfWorkMock.Setup(x => x.CompleteAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _authenticationService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be(accessToken);
        result.RefreshToken.Should().Be(refreshTokenValue);
        result.User.Should().NotBeNull();

        // Verify user access failed count was reset
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "test@example.com",
            Password = "WrongPassword"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            IsEmailVerified = true,
            IsActive = true,
            AccessFailedCount = 0
        };

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync(user);
        _passwordServiceMock.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash))
            .Returns(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authenticationService.LoginAsync(request));

        exception.Message.Should().Contain("Invalid credentials");

        // Verify access failed count was incremented
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "nonexistent@example.com",
            Password = "Password123!"
        };

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authenticationService.LoginAsync(request));

        exception.Message.Should().Contain("Invalid credentials");
    }

    [Fact]
    public async Task LoginAsync_WithUnverifiedEmail_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "test@example.com",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            IsEmailVerified = false, // Not verified
            IsActive = true
        };

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authenticationService.LoginAsync(request));

        exception.Message.Should().Contain("Email not verified");
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "test@example.com",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            IsEmailVerified = true,
            IsActive = false // Inactive
        };

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authenticationService.LoginAsync(request));

        exception.Message.Should().Contain("Account is inactive");
    }

    [Fact]
    public async Task LoginAsync_WithLockedOutUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "test@example.com",
            Password = "Password123!"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            IsEmailVerified = true,
            IsActive = true,
            LockoutEnd = DateTime.UtcNow.AddMinutes(15) // Locked out
        };

        _userRepositoryMock.Setup(x => x.GetByEmailOrUsernameAsync(request.EmailOrUsername))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authenticationService.LoginAsync(request));

        exception.Message.Should().Contain("Account is locked");
    }

    [Fact]
    public async Task VerifyEmailAsync_WithValidToken_ShouldReturnTrueAndVerifyEmail()
    {
        // Arrange
        var token = "valid-token";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FirstName = "Test",
            IsEmailVerified = false,
            EmailVerificationToken = token,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(1)
        };

        _userRepositoryMock.Setup(x => x.GetByEmailVerificationTokenAsync(token))
            .ReturnsAsync(user);
        _unitOfWorkMock.Setup(x => x.CompleteAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _authenticationService.VerifyEmailAsync(token);

        // Assert
        result.Should().BeTrue();
        user.IsEmailVerified.Should().BeTrue();
        user.EmailVerificationToken.Should().BeNull();
        user.EmailVerificationTokenExpiry.Should().BeNull();

        _emailServiceMock.Verify(x => x.SendWelcomeEmailAsync(user.Email, user.FirstName), Times.Once);
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task VerifyEmailAsync_WithInvalidToken_ShouldReturnFalse()
    {
        // Arrange
        var token = "invalid-token";

        _userRepositoryMock.Setup(x => x.GetByEmailVerificationTokenAsync(token))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authenticationService.VerifyEmailAsync(token);

        // Assert
        result.Should().BeFalse();
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Never);
    }

    [Fact]
    public async Task VerifyEmailAsync_WithExpiredToken_ShouldReturnFalse()
    {
        // Arrange
        var token = "expired-token";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            IsEmailVerified = false,
            EmailVerificationToken = token,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(-1) // Expired
        };

        _userRepositoryMock.Setup(x => x.GetByEmailVerificationTokenAsync(token))
            .ReturnsAsync(user);

        // Act
        var result = await _authenticationService.VerifyEmailAsync(token);

        // Assert
        result.Should().BeFalse();
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Never);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithValidEmail_ShouldReturnTrueAndSendEmail()
    {
        // Arrange
        var email = "test@example.com";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = "Test",
            IsActive = true
        };

        var resetToken = "reset-token";

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(email))
            .ReturnsAsync(user);
        _passwordServiceMock.Setup(x => x.GenerateResetToken())
            .Returns(resetToken);
        _unitOfWorkMock.Setup(x => x.CompleteAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _authenticationService.ForgotPasswordAsync(email);

        // Assert
        result.Should().BeTrue();
        user.PasswordResetToken.Should().Be(resetToken);
        user.PasswordResetTokenExpiry.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromMinutes(1));

        _emailServiceMock.Verify(x => x.SendPasswordResetEmailAsync(email, user.FirstName, resetToken), Times.Once);
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithNonExistentEmail_ShouldReturnTrueButNotSendEmail()
    {
        // Arrange
        var email = "nonexistent@example.com";

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(email))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authenticationService.ForgotPasswordAsync(email);

        // Assert
        result.Should().BeTrue(); // Always return true to prevent email enumeration
        _emailServiceMock.Verify(x => x.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithValidToken_ShouldReturnTrueAndResetPassword()
    {
        // Arrange
        var request = new ResetPasswordRequestDto
        {
            Token = "valid-reset-token",
            NewPassword = "NewPassword123!"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            PasswordResetToken = request.Token,
            PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1)
        };

        var hashedPassword = "new-hashed-password";

        _userRepositoryMock.Setup(x => x.GetByPasswordResetTokenAsync(request.Token))
            .ReturnsAsync(user);
        _passwordServiceMock.Setup(x => x.HashPassword(request.NewPassword))
            .Returns(hashedPassword);
        _unitOfWorkMock.Setup(x => x.CompleteAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _authenticationService.ResetPasswordAsync(request);

        // Assert
        result.Should().BeTrue();
        user.PasswordHash.Should().Be(hashedPassword);
        user.PasswordResetToken.Should().BeNull();
        user.PasswordResetTokenExpiry.Should().BeNull();

        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithInvalidToken_ShouldReturnFalse()
    {
        // Arrange
        var request = new ResetPasswordRequestDto
        {
            Token = "invalid-reset-token",
            NewPassword = "NewPassword123!"
        };

        _userRepositoryMock.Setup(x => x.GetByPasswordResetTokenAsync(request.Token))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authenticationService.ResetPasswordAsync(request);

        // Assert
        result.Should().BeFalse();
        _unitOfWorkMock.Verify(x => x.CompleteAsync(), Times.Never);
    }
}