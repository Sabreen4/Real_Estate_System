using BookingService.Application.DTOs;
using Refit;

public interface IPropertyApi
{
    [Put("/api/properties/{id}/mark-sold")]
    Task MarkAsSold(int id, [Header("Authorization")] string authorization);

    [Get("/api/users/{id}")]
    Task<UserDto> GetUserByIdAsync(int id);

    [Get("/api/properties/{id}")]
    Task<PropertyDto?> GetPropertyByIdAsync(int id, [Header("Authorization")] string authorization);
}