using IdentityService.DTOs;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace IdentityService.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UserService> _logger;

        public UserService(IUserRepository userRepository, ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<List<ResponseDto>> GetAllUsersAsync()
        {
            _logger.LogInformation("Fetching all users.");

            var users = await _userRepository.GetAllUsersAsync();

            _logger.LogInformation("Retrieved users successfully. Count: {UserCount}", users.Count);

            return users
                .Select(u => new ResponseDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    Phone = u.Phone,
                    RoleName = u.Role?.Key,
                })
                .ToList();
        }

        public async Task<ResponseDto?> GetUserByIdAsync(int id)
        {
            _logger.LogInformation("Fetching user with Id: {UserId}", id);

            var user = await _userRepository.GetUserByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("User not found with Id: {UserId}", id);

                return null;
            }

            _logger.LogInformation("User retrieved successfully with Id: {UserId}", id);

            return new ResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                RoleName = user.Role?.Key,
            };
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateUserDto dto)
        {
            _logger.LogInformation("Updating user with Id: {UserId}", id);

            var existingUser = await _userRepository.GetUserByIdAsync(id);

            if (existingUser == null)
            {
                _logger.LogWarning("Update failed. User not found with Id: {UserId}", id);

                return false;
            }

            existingUser.FirstName = dto.FirstName;
            existingUser.LastName = dto.LastName;
            existingUser.Email = dto.Email;
            existingUser.Phone = dto.Phone;

            await _userRepository.UpdateUserAsync(existingUser);

            _logger.LogInformation("User updated successfully with Id: {UserId}", id);

            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            _logger.LogInformation("Deleting user with Id: {UserId}", id);

            var user = await _userRepository.GetUserByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("Delete failed. User not found with Id: {UserId}", id);

                return false;
            }

            await _userRepository.DeleteUserAsync(id);

            _logger.LogInformation("User deleted successfully with Id: {UserId}", id);

            return true;
        }
    }
}
