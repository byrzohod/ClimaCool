using Microsoft.Extensions.Logging;
using ClimaCool.Application.DTOs.Auth;
using ClimaCool.Application.Interfaces;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Services;

public class AuthenticationService : IAuthenticationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthenticationService> _logger;

    public AuthenticationService(
        IUnitOfWork unitOfWork,
        IPasswordService passwordService,
        IJwtService jwtService,
        IEmailService emailService,
        ILogger<AuthenticationService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Check if email or username already exists
        if (!await _unitOfWork.Users.IsEmailUniqueAsync(request.Email))
        {
            throw new InvalidOperationException("Email is already registered");
        }

        if (!await _unitOfWork.Users.IsUsernameUniqueAsync(request.Username))
        {
            throw new InvalidOperationException("Username is already taken");
        }

        // Create new user
        var user = new User
        {
            Email = request.Email.ToLower(),
            Username = request.Username.ToLower(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = _passwordService.HashPassword(request.Password),
            EmailVerificationToken = _passwordService.GenerateVerificationToken(),
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(1),
            EmailVerified = false
        };

        await _unitOfWork.Users.AddAsync(user);

        // Assign default customer role
        var customerRole = await _unitOfWork.Roles.SingleOrDefaultAsync(r => r.Name == Role.Customer);
        if (customerRole != null)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = customerRole.Id,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.CompleteAsync();

        // Send verification email
        await _emailService.SendVerificationEmailAsync(user.Email, user.FirstName, user.EmailVerificationToken!);

        // Generate tokens
        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("User {Email} registered successfully", user.Email);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = _jwtService.GetTokenExpiry(),
            User = MapUserToDto(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _unitOfWork.Users.GetByEmailOrUsernameAsync(request.EmailOrUsername);
        
        if (user == null)
        {
            _logger.LogWarning("Login attempt failed for {EmailOrUsername} - user not found", request.EmailOrUsername);
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        // Check if account is locked
        if (user.IsLockedOut())
        {
            _logger.LogWarning("Login attempt for locked account {Email}", user.Email);
            throw new UnauthorizedAccessException($"Account is locked. Please try again after {user.LockoutEnd}");
        }

        // Verify password
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.IncrementAccessFailedCount();
            await _unitOfWork.CompleteAsync();
            
            _logger.LogWarning("Invalid password for user {Email}. Failed attempts: {Count}", 
                user.Email, user.AccessFailedCount);
            
            if (user.IsLockedOut())
            {
                throw new UnauthorizedAccessException($"Account is locked due to multiple failed attempts. Please try again after 15 minutes");
            }
            
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        // Reset failed count on successful login
        user.ResetAccessFailedCount();
        user.LastLoginAt = DateTime.UtcNow;
        await _unitOfWork.CompleteAsync();

        // Generate tokens
        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = request.RememberMe ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddDays(7)
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity);
        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = _jwtService.GetTokenExpiry(),
            User = MapUserToDto(user)
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        // Validate the JWT token (even if expired)
        var principal = _jwtService.ValidateToken(request.Token);
        if (principal == null)
        {
            throw new UnauthorizedAccessException("Invalid token");
        }

        var userId = Guid.Parse(principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "");
        
        // Find and validate refresh token
        var storedToken = await _unitOfWork.RefreshTokens
            .SingleOrDefaultAsync(rt => rt.Token == request.RefreshToken && rt.UserId == userId);

        if (storedToken == null || !storedToken.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        // Revoke old refresh token
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.ReasonRevoked = "Replaced by new token";

        // Get user with roles
        var user = await _unitOfWork.Users.GetUserWithRolesAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Generate new tokens
        var newToken = _jwtService.GenerateToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        // Save new refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            ReplacedByToken = storedToken.Token
        };

        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity);
        await _unitOfWork.CompleteAsync();

        return new AuthResponseDto
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = _jwtService.GetTokenExpiry(),
            User = MapUserToDto(user)
        };
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        var user = await _unitOfWork.Users.GetByEmailVerificationTokenAsync(token);
        
        if (user == null)
        {
            _logger.LogWarning("Email verification failed - invalid or expired token");
            return false;
        }

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        await _unitOfWork.CompleteAsync();

        // Send welcome email
        await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);

        _logger.LogInformation("Email verified successfully for user {Email}", user.Email);
        return true;
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email);
        
        // Don't reveal if email exists
        if (user == null)
        {
            _logger.LogWarning("Password reset requested for non-existent email {Email}", email);
            return true;
        }

        user.PasswordResetToken = _passwordService.GenerateResetToken();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

        await _unitOfWork.CompleteAsync();

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FirstName, user.PasswordResetToken);

        _logger.LogInformation("Password reset email sent to {Email}", user.Email);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var user = await _unitOfWork.Users.GetByPasswordResetTokenAsync(request.Token);
        
        if (user == null)
        {
            _logger.LogWarning("Password reset failed - invalid or expired token");
            return false;
        }

        user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.ResetAccessFailedCount();

        await _unitOfWork.CompleteAsync();

        _logger.LogInformation("Password reset successfully for user {Email}", user.Email);
        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetUserWithRolesAsync(userId);
        return user != null ? MapUserToDto(user) : null;
    }

    public async Task LogoutAsync(Guid userId)
    {
        // Revoke all active refresh tokens for the user
        var activeTokens = await _unitOfWork.RefreshTokens
            .FindAsync(rt => rt.UserId == userId && rt.RevokedAt == null);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
            token.ReasonRevoked = "User logged out";
        }

        await _unitOfWork.CompleteAsync();
        _logger.LogInformation("User {UserId} logged out successfully", userId);
    }

    private UserDto MapUserToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            EmailVerified = user.EmailVerified,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };
    }
}