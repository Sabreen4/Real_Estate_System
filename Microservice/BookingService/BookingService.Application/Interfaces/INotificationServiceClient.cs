using BookingService.Application.DTOs;
using Refit;

namespace BookingService.Application.Interfaces
{
    public interface INotificationServiceClient
    {
        [Post("/api/notifications/email")]
        Task SendEmailAsync(
            [Body] SendEmailRequest request,
            [Header("Authorization")] string token
        );
    }
}
