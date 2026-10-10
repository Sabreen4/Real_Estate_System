using IdentityService.DTOs;
using IdentityService.Models;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IdentityService.Tests.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _repoMock;
        private readonly Mock<ILogger<UserService>> _loggerMock;
        private readonly UserService _service;

        public UserServiceTests()
        {
            _repoMock = new Mock<IUserRepository>();
            _loggerMock = new Mock<ILogger<UserService>>();

            _service = new UserService(_repoMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnUsers()
        {
            var users = new List<User>
            {
                new User
                {
                    Id = 1,
                    FirstName = "John",
                    Email = "john@test.com",
                    Role = new RefTerm { Key = "ADMIN" },
                },
            };

            _repoMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);

            var result = await _service.GetAllUsersAsync();

            Assert.Single(result);
            Assert.Equal("John", result[0].FirstName);
        }

        [Fact]
        public async Task GetUserByIdAsync_ShouldReturnUser_WhenExists()
        {
            var user = new User { Id = 1, FirstName = "John" };

            _repoMock.Setup(r => r.GetUserByIdAsync(1)).ReturnsAsync(user);

            var result = await _service.GetUserByIdAsync(1);

            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldReturnFalse_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetUserByIdAsync(1)).ReturnsAsync((User?)null);

            var result = await _service.DeleteUserAsync(1);

            Assert.False(result);
        }
    }
}
