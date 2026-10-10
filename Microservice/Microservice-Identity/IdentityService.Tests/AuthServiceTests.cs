using IdentityService.DTOs;
using IdentityService.Exceptions;
using IdentityService.Helpers;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IdentityService.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IAuthRepository> _repoMock;
        private readonly JwtHelper _jwtHelper;
        private readonly Mock<ILogger<AuthService>> _loggerMock;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _repoMock = new Mock<IAuthRepository>();
            _loggerMock = new Mock<ILogger<AuthService>>();

            // Fake JWT configuration
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        { "Jwt:Key", "ThisIsSuperSecretTestKeyForJwt1234567890" },
                        { "Jwt:Issuer", "TestIssuer" },
                        { "Jwt:Audience", "TestAudience" },
                    }
                )
                .Build();

            _jwtHelper = new JwtHelper(config);

            _service = new AuthService(_repoMock.Object, _jwtHelper, _loggerMock.Object);
        }

        // =========================
        // REGISTER SUCCESS
        // =========================

        [Fact]
        public async Task RegisterAsync_ShouldCreateUser_WhenValidRequest()
        {
            var request = new RegisterRequestDto
            {
                FirstName = "Sabreen",
                Email = "test@mail.com",
                Password = "123456",
                Role = "AGENT",
            };

            var refTerm = new RefTerm { Id = 1, Key = "AGENT" };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync((User)null);

            _repoMock.Setup(r => r.GetRoleByKeyAsync("AGENT")).ReturnsAsync(refTerm);

            _repoMock.Setup(r => r.CreateUserAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

            var result = await _service.RegisterAsync(request);

            Assert.True(result.Success);
            Assert.Equal(request.Email, result.Email);

            _repoMock.Verify(r => r.CreateUserAsync(It.IsAny<User>()), Times.Once);
        }

        // =========================
        // REGISTER FAIL - USER EXISTS
        // =========================

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenUserExists()
        {
            var request = new RegisterRequestDto
            {
                Email = "test@mail.com",
                Password = "123456",
                Role = "AGENT",
            };

            var existingUser = new User { Email = request.Email };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync(existingUser);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.RegisterAsync(request));

            Assert.Equal(409, ex.StatusCode);
        }

        // =========================
        // REGISTER FAIL - INVALID ROLE
        // =========================

        [Fact]
        public async Task RegisterAsync_ShouldThrowException_WhenRoleInvalid()
        {
            var request = new RegisterRequestDto
            {
                Email = "test@mail.com",
                Password = "123456",
                Role = "INVALID",
            };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync((User)null);

            _repoMock.Setup(r => r.GetRoleByKeyAsync("INVALID")).ReturnsAsync((RefTerm)null);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.RegisterAsync(request));

            Assert.Equal(400, ex.StatusCode);
        }

        // =========================
        // LOGIN SUCCESS
        // =========================

        [Fact]
        public async Task LoginAsync_ShouldReturnToken_WhenValidCredentials()
        {
            var password = "123456";

            var request = new LoginRequestDto { Email = "test@mail.com", Password = password };

            var user = new User
            {
                Id = 1,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),

                Role = new RefTerm { Id = 1, Key = "AGENT" },
            };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync(user);

            var result = await _service.LoginAsync(request);

            Assert.True(result.Success);
            Assert.NotNull(result.Token);
        }

        // =========================
        // LOGIN FAIL - WRONG PASSWORD
        // =========================

        [Fact]
        public async Task LoginAsync_ShouldThrowException_WhenPasswordWrong()
        {
            var request = new LoginRequestDto
            {
                Email = "test@mail.com",
                Password = "wrong-password",
            };

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct"),
            };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync(user);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(request));

            Assert.Equal(401, ex.StatusCode);
        }

        // =========================
        // LOGIN FAIL - USER NOT FOUND
        // =========================

        [Fact]
        public async Task LoginAsync_ShouldThrowException_WhenUserNotFound()
        {
            var request = new LoginRequestDto { Email = "notfound@mail.com", Password = "123456" };

            _repoMock.Setup(r => r.GetUserByEmailAsync(request.Email)).ReturnsAsync((User)null);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(request));

            Assert.Equal(401, ex.StatusCode);
        }
    }
}
