using Microsoft.AspNetCore.Http;
using PropertyService.Application.DTOs;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using PropertyService.Infrastructure.Persistence;

namespace PropertyService.Infrastructure.UserSyncService
{
    public class UserSyncService
    {
        //private readonly IIdentityApi _identityApi;
        private readonly AppDbContext _context;

        // private readonly IHttpContextAccessor _httpContextAccessor;

        public UserSyncService(
            // IIdentityApi identityApi,
            AppDbContext context
        // IHttpContextAccessor httpContextAccessor
        )
        {
            // _identityApi = identityApi;
            _context = context;
            //_httpContextAccessor = httpContextAccessor;
        }

        /*private string GetToken()
        {
            var token = _httpContextAccessor
                .HttpContext?.Request.Headers["Authorization"]
                .ToString();

            return token ?? "";
        }*/

        public async Task<User?> GetUserById(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task SyncUserDirect(SyncUserRequestDto dto)
        {
            var existingUser = await _context.Users.FindAsync(dto.Id);

            if (existingUser == null)
            {
                existingUser = new User
                {
                    Id = dto.Id,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    RoleId = dto.RoleId,
                };
                _context.Users.Add(existingUser);
            }
            else
            {
                existingUser.FirstName = dto.FirstName;
                existingUser.LastName = dto.LastName;
                existingUser.Email = dto.Email;
                existingUser.RoleId = dto.RoleId;
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }
    }
}
