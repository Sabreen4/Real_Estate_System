using IdentityService.DTOs;
using IdentityService.Models;

namespace IdentityService.Services.Interfaces
{
    public interface IUserService
    {
        Task<List<ResponseDto>> GetAllUsersAsync();
        Task<ResponseDto?> GetUserByIdAsync(int id);

        Task<bool> UpdateUserAsync(int id, UpdateUserDto dto);
        Task<bool> DeleteUserAsync(int id);
    }
}