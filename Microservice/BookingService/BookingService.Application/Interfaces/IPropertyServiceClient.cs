using BookingService.Application.DTOs;
using Refit;

namespace BookingService.Application.Interfaces
{
    public interface IPropertyServiceClient
    {
        [Get("/api/users/{id}")]
        Task<UserDto> GetUserByIdAsync(int id);

        [Get("/api/properties")]
        Task<PaginatedResponse<PropertySummaryDto>> GetPropertiesByAgentAsync(
            [Query] int userId,
            [Header("Authorization")] string authorization
        );

        [Get("/api/properties/{id}")] // ← calls port 5017 directly
        Task<PropertySummaryDto> GetPropertyByIdAsync(
            int id,
            [Header("Authorization")] string authorization
        );
    }
}
