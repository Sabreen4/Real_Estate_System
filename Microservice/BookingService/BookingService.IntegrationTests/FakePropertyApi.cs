using BookingService.Application.Interfaces;
using BookingService.Application.DTOs;

namespace BookingService.IntegrationTests;

public class FakePropertyApi : IPropertyApi
{
    public Task MarkAsSold(int propertyId, string token)
    {
        // Do nothing — just simulate success
        return Task.CompletedTask;
    }

    public Task<UserDto> GetUserByIdAsync(int userId)
    {
        // Return fake user
        var user = new UserDto
        {
            Id = userId,
            FirstName = "Test User",
            Email = "test@test.com"
        };

        return Task.FromResult(user);
    }
}