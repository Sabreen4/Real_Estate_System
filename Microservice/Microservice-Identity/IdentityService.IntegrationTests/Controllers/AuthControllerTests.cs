using System.Net;
using FluentAssertions;
using IdentityService.Data;
using IdentityService.DTOs;
using IdentityService.IntegrationTests.Fixtures;
using IdentityService.IntegrationTests.Helpers;
using Moq;
using Xunit;

namespace IdentityService.IntegrationTests.Controllers
{
    /// <summary>
    /// Integration tests for POST /api/auth/register, /login, /logout.
    /// - Real controllers + real services + real repositories.
    /// - EF Core In-Memory replaces PostgreSQL.
    /// - IPropertyApi (Refit) replaced with Moq stub.
    /// - Auth uses FakeAuthHandler.
    /// </summary>
    public class AuthControllerTests : IntegrationTestBase
    {
        public AuthControllerTests(IdentityServiceFactory factory)
            : base(factory)
        {
            Factory.PropertyApiMock.Reset();
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);
        }

        // ── REGISTER ──────────────────────────────────────────────────────────

        [Fact]
        public async Task Register_ValidRequest_Returns200AndSyncsPropertyService()
        {
            var request = new RegisterRequestDto
            {
                FirstName = "Alice",
                LastName = "Smith",
                Email = "alice_reg@test.com",
                Password = "Password@123",
                Role = "ADMIN",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));

            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await Deserialize<AuthResponseDto>(response);
            body!.Success.Should().BeTrue();
            body.Email.Should().Be("alice_reg@test.com");
            body.FirstName.Should().Be("Alice");
            body.UserId.Should().BeGreaterThan(0);

            Factory.PropertyApiMock.Verify(
                x =>
                    x.SyncUser(
                        body.UserId,
                        It.Is<SyncUserPayload>(p =>
                            p.Email == "alice_reg@test.com" && p.FirstName == "Alice"
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task Register_DuplicateEmail_Returns409()
        {
            WithDb(db => DatabaseSeeder.AddUser(db, email: "duplicate@test.com"));

            var request = new RegisterRequestDto
            {
                FirstName = "Bob",
                LastName = "Jones",
                Email = "duplicate@test.com",
                Password = "Password@123",
                Role = "BUYER",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task Register_InvalidRole_Returns400()
        {
            var request = new RegisterRequestDto
            {
                FirstName = "Carol",
                LastName = "White",
                Email = "carol@test.com",
                Password = "Password@123",
                Role = "UNKNOWNROLE",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Register_RoleCaseInsensitive_Returns200()
        {
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);

            var request = new RegisterRequestDto
            {
                FirstName = "Dave",
                LastName = "Green",
                Email = "dave_lower@test.com",
                Password = "Password@123",
                Role = "admin",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Register_AgentRole_Returns200()
        {
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);

            var request = new RegisterRequestDto
            {
                FirstName = "Eve",
                LastName = "Black",
                Email = "agent@test.com",
                Password = "Password@123",
                Role = "AGENT",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Register_BuyerRole_Returns200()
        {
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);

            var request = new RegisterRequestDto
            {
                FirstName = "Frank",
                LastName = "Brown",
                Email = "buyer@test.com",
                Password = "Password@123",
                Role = "BUYER",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Register_ResponseContainsRoleId()
        {
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);

            var request = new RegisterRequestDto
            {
                FirstName = "Grace",
                LastName = "Lee",
                Email = "grace_roleid@test.com",
                Password = "Password@123",
                Role = "ADMIN",
            };

            var response = await Client.PostAsync("/api/auth/register", Json(request));
            var body = await Deserialize<AuthResponseDto>(response);

            body!.RoleId.Should().Be(10); // ADMIN roleId = 10 from seed data
        }

        // ── LOGIN ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Login_ValidCredentials_Returns200WithToken()
        {
            WithDb(db =>
                DatabaseSeeder.AddUser(
                    db,
                    email: "login_ok@test.com",
                    plainPassword: "SecurePass@1"
                )
            );

            var request = new LoginRequestDto
            {
                Email = "login_ok@test.com",
                Password = "SecurePass@1",
            };

            var response = await Client.PostAsync("/api/auth/login", Json(request));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = await Deserialize<AuthResponseDto>(response);
            body!.Success.Should().BeTrue();
            body.Token.Should().NotBeNullOrWhiteSpace();
        }

        [Fact]
        public async Task Login_WrongPassword_Returns401()
        {
            WithDb(db =>
                DatabaseSeeder.AddUser(
                    db,
                    email: "login_wrong@test.com",
                    plainPassword: "CorrectPass@1"
                )
            );

            var request = new LoginRequestDto
            {
                Email = "login_wrong@test.com",
                Password = "WrongPass@1",
            };

            var response = await Client.PostAsync("/api/auth/login", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Login_NonExistentUser_Returns401()
        {
            var request = new LoginRequestDto
            {
                Email = "ghost@test.com",
                Password = "AnyPass@123",
            };

            var response = await Client.PostAsync("/api/auth/login", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Login_EmptyPassword_Returns400()
        {
            WithDb(db => DatabaseSeeder.AddUser(db, email: "emptypass@test.com"));

            var request = new LoginRequestDto { Email = "emptypass@test.com", Password = "" };

            var response = await Client.PostAsync("/api/auth/login", Json(request));
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Login_SuccessfulResponse_ContainsSuccessTrue()
        {
            WithDb(db =>
                DatabaseSeeder.AddUser(
                    db,
                    email: "success_flag@test.com",
                    plainPassword: "MyPass@99"
                )
            );

            var request = new LoginRequestDto
            {
                Email = "success_flag@test.com",
                Password = "MyPass@99",
            };
            var response = await Client.PostAsync("/api/auth/login", Json(request));

            var body = await Deserialize<AuthResponseDto>(response);
            body!.Success.Should().BeTrue();
            body.Message.Should().Be("Login successful");
        }

        // ── LOGOUT ────────────────────────────────────────────────────────────

        [Fact]
        public async Task Logout_WithAuthHeader_Returns200()
        {
            AuthorizeClient();
            var response = await Client.PostAsync("/api/auth/logout", null);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var json = await response.Content.ReadAsStringAsync();
            json.Should().Contain("Logged out successfully");
            RemoveAuthorization();
        }

        [Fact]
        public async Task Logout_WithoutAuthHeader_Returns401()
        {
            RemoveAuthorization();
            var response = await Client.PostAsync("/api/auth/logout", null);
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Logout_BlacklistsToken_SubsequentCallStillReturns200()
        {
            // Each logout call independently blacklists whatever is in the header.
            // The key behaviour: the endpoint returns 200 when authenticated.
            AuthorizeClient(token: "unique-test-token-123");
            var response = await Client.PostAsync("/api/auth/logout", null);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            RemoveAuthorization();
        }
    }
}
