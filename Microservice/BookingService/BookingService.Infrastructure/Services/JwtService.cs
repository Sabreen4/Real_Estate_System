using BookingService.Application.Interfaces;

namespace BookingService.Infrastructure.Services
{
    public class JwtService : IJwtService
    {
        public string GenerateToken(string userId)
        {
            return "dummy-token"; // replace with real JWT later
        }
    }
}