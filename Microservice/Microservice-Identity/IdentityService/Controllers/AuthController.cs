using IdentityService.DTOs;
using IdentityService.Helpers;
using IdentityService.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IdentityService.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPropertyApi _propertyApi;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService authService,
            IPropertyApi propertyApi,
            ILogger<AuthController> logger
        )
        {
            _authService = authService;
            _propertyApi = propertyApi;
            _logger = logger;
        }

        // =========================
        // REGISTER
        // =========================

        [HttpPost("register")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Register(RegisterRequestDto request)
        {
            _logger.LogInformation("Register request received for Email: {Email}", request.Email);

            var result = await _authService.RegisterAsync(request);

            _logger.LogInformation(
                "User registered successfully. UserId: {UserId}, Email: {Email}",
                result.UserId,
                result.Email
            );
            var token = Request.Headers["Authorization"].ToString();
            // Send user data directly — no token needed
            await _propertyApi.SyncUser(
                result.UserId,
                new SyncUserPayload
                {
                    Id = result.UserId,
                    FirstName = result.FirstName,
                    LastName = result.LastName,
                    Email = result.Email,
                    RoleId = result.RoleId,
                },
                token
            );
            _logger.LogInformation(
                "User synced successfully with Property Service. UserId: {UserId}",
                result.UserId
            );
            return Ok(result);
        }

        // =========================
        // LOGIN
        // =========================

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            _logger.LogInformation("Login request received for Email: {Email}", request.Email);
            var result = await _authService.LoginAsync(request);

            if (!result.Success)
                return Unauthorized(result.Message); // 401

            _logger.LogInformation("Login successful for Email: {Email}", request.Email);

            return Ok(result);
        }

        // =========================
        // FORGOT PASSWORD
        // =========================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            _logger.LogInformation(
                "Forgot password request received for Email: {Email}",
                request.Email
            );

            await _authService.ForgotPasswordAsync(request);

            // Always return same message — don't reveal if email exists
            return Ok(new { message = "If this email exists, an OTP has been sent." });
        }

        // =========================
        // VERIFY OTP
        // =========================
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp(VerifyOtpDto request)
        {
            _logger.LogInformation("Verify OTP request received for Email: {Email}", request.Email);

            var email = await _authService.VerifyOtpAsync(request);

            _logger.LogInformation("OTP verified successfully for Email: {Email}", request.Email);

            return Ok(new { email });
        }

        // =========================
        // RESET PASSWORD
        // =========================
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto request)
        {
            _logger.LogInformation(
                "Reset password request received for Email: {Email}",
                request.Email
            );

            await _authService.ResetPasswordAsync(request);

            _logger.LogInformation("Password reset successfully for Email: {Email}", request.Email);

            return Ok(new { message = "Password reset successfully." });
        }

        // =========================
        // LOGOUT
        // =========================

        /// <summary>
        /// Logs out the user by blacklisting the JWT token.
        /// </summary>
        /// <returns>Returns a success message.</returns>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            _logger.LogInformation("Logout request received.");
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!string.IsNullOrEmpty(token))
            {
                TokenBlacklist.Add(token);
                _logger.LogInformation("Token blacklisted successfully.");
            }

            return Ok(new { message = "Logged out successfully." });
        }
    }
}
