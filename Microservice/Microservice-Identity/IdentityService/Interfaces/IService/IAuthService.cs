using IdentityService.DTOs;

namespace IdentityService.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task LogoutAsync();

        // OTP
        Task ForgotPasswordAsync(ForgotPasswordDto request);
        Task<string> VerifyOtpAsync(VerifyOtpDto request);
        Task ResetPasswordAsync(ResetPasswordDto request);
    }
}