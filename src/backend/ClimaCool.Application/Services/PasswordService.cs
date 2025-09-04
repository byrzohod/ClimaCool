using System.Security.Cryptography;
using ClimaCool.Application.Interfaces;

namespace ClimaCool.Application.Services;

public class PasswordService : IPasswordService
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            return false;
        }
    }

    public string GenerateResetToken()
    {
        return GenerateSecureToken(32);
    }

    public string GenerateVerificationToken()
    {
        return GenerateSecureToken(32);
    }

    private string GenerateSecureToken(int length)
    {
        var randomNumber = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}