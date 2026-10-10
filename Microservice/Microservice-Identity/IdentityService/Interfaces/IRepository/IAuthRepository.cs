using IdentityService.Models;

namespace IdentityService.Repositories.Interfaces
{
    public interface IAuthRepository
    {
        Task<User?> GetUserByEmailAsync(string email);

        Task CreateUserAsync(User user);

        Task UpsertOtpAsync(int userId, string otp, DateTime expiresAt);
        Task<OtpVerification?> GetOtpAsync(int userId);
        Task DeleteOtpAsync(int userId);
        Task UpdateUserAsync(User user);
        Task<RefTerm?> GetRoleByKeyAsync(string key);
    }
}
