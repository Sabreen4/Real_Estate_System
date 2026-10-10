using IdentityService.Models;

namespace IdentityService.Helpers
{
    public interface IJwtHelper
    {
        string GenerateToken(User user);
    }
}