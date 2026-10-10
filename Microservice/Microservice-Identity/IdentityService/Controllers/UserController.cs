using IdentityService.DTOs;
using IdentityService.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IdentityService.Controllers
{
    [ApiController]
    [Route("api/users")]
    // Only ADMIN can manage users

    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IPropertyApi _propertyApi;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userService,
            IPropertyApi propertyApi,
            ILogger<UserController> logger
        )
        {
            _userService = userService;
            _propertyApi = propertyApi;
            _logger = logger;
        }

        // =========================
        // GET ALL USERS
        // =========================

        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAllUsers()
        {
            _logger.LogInformation("Admin requested all users.");
            var users = await _userService.GetAllUsersAsync();
            _logger.LogInformation(
                "Successfully retrieved all users. Count: {UserCount}",
                users.Count()
            );
            return Ok(users);
        }

        // =========================
        // GET USER BY ID
        // =========================

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetUserById(int id)
        {
            _logger.LogInformation("Request received to fetch user with Id: {UserId}", id);

            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("User not found with Id: {UserId}", id);
                return NotFound($"User with ID {id} not found");
            }
            _logger.LogInformation("User retrieved successfully with Id: {UserId}", id);
            return Ok(user);
        }

        // =========================
        // UPDATE USER
        // =========================
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updatedUser)
        {
            _logger.LogInformation("Update request received for UserId: {UserId}", id);

            var result = await _userService.UpdateUserAsync(id, updatedUser);

            if (!result)
            {
                _logger.LogWarning("User not found. UserId: {UserId}", id);

                return NotFound($"User with ID {id} not found");
            }

            _logger.LogInformation(
                "User updated successfully in Identity Service. UserId: {UserId}",
                id
            );

            try
            {
                var user = await _userService.GetUserByIdAsync(id);

                var token = Request.Headers["Authorization"].ToString();

                await _propertyApi.SyncUser(
                    id,
                    new SyncUserPayload
                    {
                        Id = id,
                        FirstName = updatedUser.FirstName,
                        LastName = updatedUser.LastName,
                        Email = updatedUser.Email,
                        RoleId = user!.RoleId,
                    },
                    token
                );

                _logger.LogInformation(
                    "User synced successfully with Property Service. UserId: {UserId}",
                    id
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to sync user with Property Service. UserId: {UserId}",
                    id
                );
            }

            return Ok(new { message = "User updated successfully" });
        }

        // =========================
        // DELETE USER
        // =========================

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            _logger.LogInformation("Delete request received for UserId: {UserId}", id);
            var result = await _userService.DeleteUserAsync(id);

            if (!result)
            {
                _logger.LogWarning("User not found. UserId: {UserId}", id);
                return NotFound($"User with ID {id} not found");
            }
            await _propertyApi.DeleteUser(id);
            _logger.LogInformation(
                "User deleted successfully from Property Service. UserId: {UserId}",
                id
            );

           return Ok(new { message = "User deleted successfully" }); 
        }
    }
}
