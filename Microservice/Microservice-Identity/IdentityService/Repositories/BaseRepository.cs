// IdentityService/Repositories/BaseRepository.cs

using IdentityService.Data;
using IdentityService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityService.Repositories
{
    /// <summary>
    /// Generic base repository providing common database operations
    /// shared across all repositories.
    /// </summary>
    public abstract class BaseRepository<T> where T : class
    {
        protected readonly ApplicationDbContext _context;
        protected readonly ILogger _logger;

        public BaseRepository(ApplicationDbContext context, ILogger logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a user by their email address, including their Role.
        /// </summary>
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            _logger.LogInformation("Fetching user by Email: {Email}", email);

            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                _logger.LogWarning("User not found with Email: {Email}", email);
            else
                _logger.LogInformation("User retrieved successfully with Email: {Email}", email);

            return user;
        }

        /// <summary>
        /// Persists all pending changes to the database.
        /// </summary>
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}