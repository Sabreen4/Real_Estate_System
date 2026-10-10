using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityService.Repositories
{
    public class AuthRepository : BaseRepository<User>, IAuthRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthRepository> _logger;

        public AuthRepository(ApplicationDbContext context, ILogger<AuthRepository> logger)
            : base(context, logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CreateUserAsync(User user)
        {
            _logger.LogInformation("Creating new user with Email: {Email}", user.Email);

            await _context.Users.AddAsync(user);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User saved successfully to database. UserId: {UserId}",
                user.Id
            );
        }

        public async Task<RefTerm?> GetRoleByKeyAsync(string key)
        {
            _logger.LogInformation("Fetching role with Key: {RoleKey}", key);

            var role = await _context.RefTerms.FirstOrDefaultAsync(r =>
                r.Key.ToUpper() == key.ToUpper()
            );

            if (role == null)
            {
                _logger.LogWarning("Role not found with Key: {RoleKey}", key);
            }
            else
            {
                _logger.LogInformation("Role retrieved successfully with Key: {RoleKey}", key);
            }

            return role;
        }

        public async Task UpsertOtpAsync(int userId, string otp, DateTime expiresAt)
        {
            _logger.LogInformation("Upserting OTP for UserId: {UserId}", userId);

            var existing = await _context.OtpVerifications.FirstOrDefaultAsync(o =>
                o.UserId == userId
            );

            if (existing == null)
            {
                await _context.OtpVerifications.AddAsync(
                    new OtpVerification
                    {
                        UserId = userId,
                        Otp = otp,
                        ExpiresAt = expiresAt,
                        CreatedAt = DateTime.UtcNow,
                    }
                );
            }
            else
            {
                existing.Otp = otp;
                existing.ExpiresAt = expiresAt;
                existing.CreatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("OTP upserted successfully for UserId: {UserId}", userId);
        }

        public async Task<OtpVerification?> GetOtpAsync(int userId)
        {
            _logger.LogInformation("Fetching OTP for UserId: {UserId}", userId);

            return await _context.OtpVerifications.FirstOrDefaultAsync(o =>
                o.UserId == userId && o.ExpiresAt > DateTime.UtcNow
            );
        }

        public async Task DeleteOtpAsync(int userId)
        {
            _logger.LogInformation("Deleting OTP for UserId: {UserId}", userId);

            var otp = await _context.OtpVerifications.FirstOrDefaultAsync(o => o.UserId == userId);

            if (otp != null)
            {
                _context.OtpVerifications.Remove(otp);
                await _context.SaveChangesAsync();
                _logger.LogInformation("OTP deleted for UserId: {UserId}", userId);
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            _logger.LogInformation("Updating password for UserId: {UserId}", user.Id);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Password updated successfully. UserId: {UserId}", user.Id);
        }
    }
}
