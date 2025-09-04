namespace ClimaCool.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task SendVerificationEmailAsync(string email, string firstName, string verificationToken);
    Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken);
    Task SendWelcomeEmailAsync(string email, string firstName);
}