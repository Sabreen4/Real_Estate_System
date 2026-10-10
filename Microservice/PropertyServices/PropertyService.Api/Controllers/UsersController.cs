using Microsoft.AspNetCore.Mvc;
using PropertyService.Application.DTOs;
using PropertyService.Application.Services;
using PropertyService.Infrastructure.Persistence;
using PropertyService.Infrastructure.UserSyncService;

namespace PropertyService.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly UserSyncService _syncService;

        public UsersController(UserSyncService syncService)
        {
            _syncService = syncService;
        }

        [HttpPost("sync/{userId}")]
        // No [Authorize] — this is an internal service-to-service call
        public async Task<IActionResult> SyncUser(int userId, [FromBody] SyncUserRequestDto userDto)
        {
            await _syncService.SyncUserDirect(userDto);
            return Ok("Synced successfully");
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            await _syncService.DeleteUser(userId);
            return Ok("User deleted successfully");
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var user = await _syncService.GetUserById(userId);
            if (user == null)
                return NotFound();

            return Ok(
                new
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                }
            );
        }
    }
}
