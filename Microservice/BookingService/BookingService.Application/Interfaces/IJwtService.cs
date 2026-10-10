namespace BookingService.Application.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(string userId);
    }
}
