using IdentityService.Data;
using IdentityService.DTOs;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityService.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(ApplicationDbContext context, ILogger<UserRepository> logger)
            : base(context, logger)
        {
            _context = context;
            _logger = logger;
        }

        // =========================
        // GET USER BY ID
        // =========================

        public async Task<User?> GetUserByIdAsync(int id)
        {
            _logger.LogInformation("Fetching user by Id: {UserId}", id);

            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                _logger.LogWarning("User not found with Id: {UserId}", id);
            }
            else
            {
                _logger.LogInformation("User retrieved successfully with Id: {UserId}", id);
            }

            return user;
        }

        // =========================
        // GET USER BY EMAIL
        // =========================

       

        // =========================
        // GET ALL USERS
        // =========================

        public async Task<List<User>> GetAllUsersAsync()
        {
            _logger.LogInformation("Fetching all users from database.");

            var users = await _context.Users.Include(u => u.Role).ToListAsync();

            _logger.LogInformation("Retrieved users successfully. Count: {UserCount}", users.Count);

            return users;
        }

        // =========================
        // ADD USER
        // =========================

        public async Task AddUserAsync(User user)
        {
            _logger.LogInformation("Adding new user with Email: {Email}", user.Email);

            await _context.Users.AddAsync(user);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User added successfully. UserId: {UserId}", user.Id);
        }

        // =========================
        // UPDATE USER
        // =========================

        public async Task UpdateUserAsync(User user)
        {
            _logger.LogInformation("Updating user with Id: {UserId}", user.Id);

            _context.Users.Update(user);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User updated successfully with Id: {UserId}", user.Id);
        }

        // =========================
        // DELETE USER
        // =========================

        public async Task DeleteUserAsync(int id)
        {
            _logger.LogInformation("Deleting user with Id: {UserId}", id);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

            if (user != null)
            {
                _context.Users.Remove(user);

                await _context.SaveChangesAsync();

                _logger.LogInformation("User deleted successfully with Id: {UserId}", id);
            }
            else
            {
                _logger.LogWarning("Delete failed. User not found with Id: {UserId}", id);
            }
        }
    }
}
