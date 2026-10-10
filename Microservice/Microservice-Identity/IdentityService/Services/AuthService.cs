using IdentityService.DTOs;
using IdentityService.Exceptions;
using IdentityService.Helpers;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace IdentityService.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly JwtHelper _jwtHelper;
        private readonly ILogger<AuthService> _logger;
        private readonly INotificationApi _notificationApi;

        public AuthService(
            IAuthRepository authRepository,
            JwtHelper jwtHelper,
            ILogger<AuthService> logger,
            INotificationApi notificationApi
        )
        {
            _authRepository = authRepository;
            _jwtHelper = jwtHelper;
            _logger = logger;
            _notificationApi = notificationApi;
        }

        // =========================
        // REGISTER
        // =========================
        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            _logger.LogInformation("Registration attempt for Email: {Email}", request.Email);
            var existingUser = await _authRepository.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning(
                    "Registration failed. User already exists. Email: {Email}",
                    request.Email
                );

                throw new AppException("User already exists", 409);
            }

            var role = await _authRepository.GetRoleByKeyAsync(request.Role.ToUpper());
            if (role == null)
            {
                _logger.LogWarning(
                    "Registration failed. Invalid role provided. Email: {Email}, Role: {Role}",
                    request.Email,
                    request.Role
                );
                throw new AppException("Invalid role", 400);
            }

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RoleId = role.Id,
                Role = role,
            };

            await _authRepository.CreateUserAsync(user);
            _logger.LogInformation(
                "User created successfully. UserId: {UserId}, Email: {Email}, RoleId: {RoleId}",
                user.Id,
                user.Email,
                user.RoleId
            );

            return new AuthResponseDto
            {
                Success = true,
                UserId = user.Id,
                RoleId = user.RoleId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Message = "User registered successfully",
            };
        }

        // =========================
        // LOGIN
        // =========================
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            _logger.LogInformation("Login attempt for Email: {Email}", request.Email);
            var user = await _authRepository.GetUserByEmailAsync(request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Login failed. Invalid password. Email: {Email}", request.Email);

                throw new AppException("Invalid email or password.", 401);
            }

            var token = _jwtHelper.GenerateToken(user);
            _logger.LogInformation(
                "Login successful. Token generated for UserId: {UserId}, Email: {Email}",
                user.Id,
                user.Email
            );

            return new AuthResponseDto
            {
                Success = true,
                Token = token,
                Message = "Login successful",
            };
        }

        //=========================
        // LOGOUT
        // =========================
        public async Task LogoutAsync()
        {
            _logger.LogInformation("Logout called. JWT logout handled client-side.");

            // JWT logout usually handled client-side
            await Task.CompletedTask;
        }

        public async Task ForgotPasswordAsync(ForgotPasswordDto request)
        {
            _logger.LogInformation("Forgot password request for Email: {Email}", request.Email);

            var user = await _authRepository.GetUserByEmailAsync(request.Email);

            // Generic response — don't reveal if email exists
            if (user == null)
            {
                _logger.LogWarning(
                    "Forgot password: Email not found. Email: {Email}",
                    request.Email
                );
                return;
            }

            // Generate 6-digit OTP
            var otp = new Random().Next(100000, 999999).ToString();
            var expiresAt = DateTime.UtcNow.AddMinutes(5);

            // Upsert OTP (insert or replace existing)
            await _authRepository.UpsertOtpAsync(user.Id, otp, expiresAt);

            _logger.LogInformation("OTP generated for UserId: {UserId}", user.Id);

            // Call NotificationService via Refit
            var emailBody =
                $@"
        <h2>Password Reset OTP</h2>
        <p>Your OTP is: <strong>{otp}</strong></p>
        <p>This OTP expires in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
    ";

            await _notificationApi.SendEmailAsync(
                new SendEmailPayload
                {
                    To = user.Email,
                    Subject = "Password Reset OTP",
                    Body = emailBody,
                },
                ""
            ); // no auth token needed for internal service call

            _logger.LogInformation("OTP email sent for UserId: {UserId}", user.Id);
        }

        // =========================
        // VERIFY OTP
        // =========================
        public async Task<string> VerifyOtpAsync(VerifyOtpDto request)
        {
            _logger.LogInformation("OTP verification attempt for Email: {Email}", request.Email);

            var user = await _authRepository.GetUserByEmailAsync(request.Email);

            if (user == null)
            {
                _logger.LogWarning(
                    "OTP verification failed. User not found. Email: {Email}",
                    request.Email
                );
                throw new AppException("Invalid OTP", 400);
            }

            var otpRecord = await _authRepository.GetOtpAsync(user.Id);

            if (otpRecord == null)
            {
                _logger.LogWarning("OTP expired or not found for UserId: {UserId}", user.Id);
                throw new AppException("OTP expired or not found", 400);
            }

            if (otpRecord.Otp != request.Otp)
            {
                _logger.LogWarning("Invalid OTP entered for UserId: {UserId}", user.Id);
                throw new AppException("Invalid OTP", 400);
            }

            // OTP verified — delete it immediately
            await _authRepository.DeleteOtpAsync(user.Id);

            _logger.LogInformation("OTP verified successfully for UserId: {UserId}", user.Id);

            // Just return email
            return user.Email;
        }

        // =========================
        // RESET PASSWORD
        // =========================
        public async Task ResetPasswordAsync(ResetPasswordDto request)
        {
            _logger.LogInformation("Reset password attempt for Email: {Email}", request.Email);

            var user = await _authRepository.GetUserByEmailAsync(request.Email);

            if (user == null)
            {
                _logger.LogWarning(
                    "Reset password failed. User not found. Email: {Email}",
                    request.Email
                );
                throw new AppException("User not found", 404);
            }

            // Hash and save new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _authRepository.UpdateUserAsync(user);

            _logger.LogInformation("Password reset successfully for Email: {Email}", request.Email);
        }
    }
}
