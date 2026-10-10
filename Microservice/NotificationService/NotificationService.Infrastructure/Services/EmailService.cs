using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using NotificationService.Application.Interfaces;
using NotificationService.Infrastructure.Settings;

namespace NotificationService.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            _logger.LogInformation(
                "Email sending started. To: {Recipient}, Subject: {Subject}",
                toEmail,
                subject
            );

            if (string.IsNullOrWhiteSpace(_settings.SenderEmail))
            {
                _logger.LogWarning("Sender email is not configured.");

                throw new InvalidOperationException("Sender email is not configured.");
            }

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Recipient email is empty.");

                throw new ArgumentException(
                    "Recipient email cannot be null or empty.",
                    nameof(toEmail)
                );
            }

            var email = new MimeMessage();

            email.From.Add(
                new MailboxAddress(_settings.SenderName ?? "No Reply", _settings.SenderEmail)
            );

            email.To.Add(MailboxAddress.Parse(toEmail));

            email.Subject = subject;

            email.Body = new TextPart("html") { Text = body };

            using var smtp = new SmtpClient();

            _logger.LogInformation(
                "Connecting to SMTP server {Server}:{Port}",
                _settings.SmtpServer,
                _settings.Port
            );

            await smtp.ConnectAsync(
                _settings.SmtpServer,
                _settings.Port,
                MailKit.Security.SecureSocketOptions.StartTls
            );

            _logger.LogInformation("Authenticating SMTP user {SenderEmail}", _settings.SenderEmail);

            await smtp.AuthenticateAsync(_settings.SenderEmail, _settings.Password);

            _logger.LogInformation("Sending email to {Recipient}", toEmail);

            await smtp.SendAsync(email);

            await smtp.DisconnectAsync(true);

            _logger.LogInformation("SMTP disconnected successfully.");

            _logger.LogInformation("Email sent successfully to {Recipient}", toEmail);
        }
    }
}
