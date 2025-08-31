using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ClimaCool.Application.Interfaces;

namespace ClimaCool.Application.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly bool _enableSsl;
    private readonly string _appUrl;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _smtpHost = _configuration["Email:SMTP:Host"] ?? "localhost";
        _smtpPort = int.Parse(_configuration["Email:SMTP:Port"] ?? "1025");
        _smtpUsername = _configuration["Email:SMTP:Username"] ?? "";
        _smtpPassword = _configuration["Email:SMTP:Password"] ?? "";
        _fromEmail = _configuration["Email:SMTP:FromEmail"] ?? "noreply@climacool.com";
        _fromName = _configuration["Email:SMTP:FromName"] ?? "ClimaCool";
        _enableSsl = bool.Parse(_configuration["Email:SMTP:EnableSSL"] ?? "false");
        _appUrl = _configuration["AppUrl"] ?? "http://localhost:4200";
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        try
        {
            using var message = new MailMessage();
            message.From = new MailAddress(_fromEmail, _fromName);
            message.To.Add(new MailAddress(to));
            message.Subject = subject;
            message.Body = body;
            message.IsBodyHtml = isHtml;

            using var client = new SmtpClient(_smtpHost, _smtpPort);
            client.EnableSsl = _enableSsl;
            
            if (!string.IsNullOrEmpty(_smtpUsername))
            {
                client.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Email}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            // In production, you might want to queue the email for retry
            // For now, we'll just log the error
        }
    }

    public async Task SendVerificationEmailAsync(string email, string firstName, string verificationToken)
    {
        var verificationUrl = $"{_appUrl}/auth/verify-email?token={verificationToken}";
        
        var subject = "Verify your ClimaCool account";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Welcome to ClimaCool, {firstName}!</h2>
                <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
                <p><a href='{verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verify Email</a></p>
                <p>Or copy and paste this link in your browser:</p>
                <p>{verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account with ClimaCool, please ignore this email.</p>
                <br>
                <p>Best regards,<br>The ClimaCool Team</p>
            </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string firstName, string resetToken)
    {
        var resetUrl = $"{_appUrl}/auth/reset-password?token={resetToken}";
        
        var subject = "Reset your ClimaCool password";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Hi {firstName},</h2>
                <p>We received a request to reset your password. Click the link below to create a new password:</p>
                <p><a href='{resetUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a></p>
                <p>Or copy and paste this link in your browser:</p>
                <p>{resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                <br>
                <p>Best regards,<br>The ClimaCool Team</p>
            </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Welcome to ClimaCool!";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Welcome to ClimaCool, {firstName}!</h2>
                <p>Your account has been successfully verified. You can now enjoy all the features of our platform:</p>
                <ul>
                    <li>Browse our extensive catalog of HVAC products</li>
                    <li>Save items to your wishlist</li>
                    <li>Track your orders</li>
                    <li>Get exclusive deals and offers</li>
                </ul>
                <p><a href='{_appUrl}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Start Shopping</a></p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <br>
                <p>Best regards,<br>The ClimaCool Team</p>
            </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }
}