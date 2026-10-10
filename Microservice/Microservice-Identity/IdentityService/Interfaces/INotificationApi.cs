using Refit;

public interface INotificationApi
{
    [Post("/api/notifications/email")]
    Task SendEmailAsync([Body] SendEmailPayload payload, [Header("Authorization")] string token);
}

public class SendEmailPayload
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}