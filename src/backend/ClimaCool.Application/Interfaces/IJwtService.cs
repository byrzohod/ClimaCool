using System.Security.Claims;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
    string GenerateRefreshToken();
    DateTime GetTokenExpiry();
}