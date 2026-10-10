using System.Net;
using FluentAssertions;
using IdentityService.DTOs;
using IdentityService.IntegrationTests.Fixtures;
using IdentityService.IntegrationTests.Helpers;
using Moq;
using Xunit;

namespace IdentityService.IntegrationTests.Controllers
{
    /// <summary>
    /// Integration tests for GET/PUT/DELETE /api/users.
    /// - Real controllers + services + repositories.
    /// - EF Core In-Memory database.
    /// - IPropertyApi replaced with Moq.
    /// - Auth via FakeAuthHandler (ADMIN role injected by default).
    /// </summary>
    public class UserControllerTests : IntegrationTestBase
    {
        public UserControllerTests(IdentityServiceFactory factory)
            : base(factory)
        {
            Factory.PropertyApiMock.Reset();
            Factory
                .PropertyApiMock.Setup(x =>
                    x.SyncUser(It.IsAny<int>(), It.IsAny<SyncUserPayload>())
                )
                .Returns(Task.CompletedTask);
            Factory
                .PropertyApiMock.Setup(x => x.DeleteUser(It.IsAny<int>()))
                .Returns(Task.CompletedTask);
        }

        // ── GET ALL USERS ─────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllUsers_AsAdmin_Returns200WithList()
        {
            WithDb(db =>
            {
                DatabaseSeeder.AddUser(db, email: "user1_getall@test.com");
                DatabaseSeeder.AddUser(db, email: "user2_getall@test.com", firstName: "Jane");
            });

            AuthorizeClient();
            var response = await Client.GetAsync("/api/users");

            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var users = await Deserialize<List<ResponseDto>>(response);
            users.Should().NotBeNull();
            users!.Count.Should().BeGreaterThanOrEqualTo(2);
            RemoveAuthorization();
        }

        [Fact]
        public async Task GetAllUsers_Unauthenticated_Returns401()
        {
            RemoveAuthorization();
            var response = await Client.GetAsync("/api/users");
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetAllUsers_Returns200WithCorrectFields()
        {
            WithDb(db =>
                DatabaseSeeder.AddUser(
                    db,
                    firstName: "Fields",
                    lastName: "Check",
                    email: "fields_check@test.com",
                    roleId: 10
                )
            );

            AuthorizeClient();
            var response = await Client.GetAsync("/api/users");
            var users = await Deserialize<List<ResponseDto>>(response);

            var target = users!.FirstOrDefault(u => u.Email == "fields_check@test.com");
            target.Should().NotBeNull();
            target!.FirstName.Should().Be("Fields");
            target.LastName.Should().Be("Check");
            target.Email.Should().Be("fields_check@test.com");
            RemoveAuthorization();
        }

        // ── GET USER BY ID ────────────────────────────────────────────────────

        [Fact]
        public async Task GetUserById_ExistingId_Returns200WithUser()
        {
            var user = WithDb(db => DatabaseSeeder.AddUser(db, email: "getbyid@test.com"));

            AuthorizeClient();
            var response = await Client.GetAsync($"/api/users/{user.Id}");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = await Deserialize<ResponseDto>(response);
            body!.Email.Should().Be("getbyid@test.com");
            body.Id.Should().Be(user.Id);
            RemoveAuthorization();
        }

        [Fact]
        public async Task GetUserById_NonExistentId_Returns404()
        {
            AuthorizeClient();
            var response = await Client.GetAsync("/api/users/999999");

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            RemoveAuthorization();
        }

        [Fact]
        public async Task GetUserById_Unauthenticated_Returns401()
        {
            RemoveAuthorization();
            var response = await Client.GetAsync("/api/users/1");
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetUserById_Returns_CorrectRoleId()
        {
            // ADMIN roleId = 10 from seed data
            var user = WithDb(db =>
                DatabaseSeeder.AddUser(db, email: "roleid_check@test.com", roleId: 10)
            );

            AuthorizeClient();
            var response = await Client.GetAsync($"/api/users/{user.Id}");
            var body = await Deserialize<ResponseDto>(response);

            body!.RoleId.Should().Be(10);
            RemoveAuthorization();
        }

        // ── UPDATE USER ───────────────────────────────────────────────────────

        [Fact]
        public async Task UpdateUser_ExistingId_Returns200AndSyncsPropertyService()
        {
            var user = WithDb(db => DatabaseSeeder.AddUser(db, email: "update_me@test.com"));

            var updateDto = new UpdateUserDto
            {
                FirstName = "Updated",
                LastName = "Name",
                Email = "update_me@test.com",
                Phone = "1112223333",
            };

            AuthorizeClient();
            var response = await Client.PutAsync($"/api/users/{user.Id}", Json(updateDto));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var msg = await response.Content.ReadAsStringAsync();
            msg.Should().Contain("updated successfully");

            Factory.PropertyApiMock.Verify(
                x =>
                    x.SyncUser(
                        user.Id,
                        It.Is<SyncUserPayload>(p =>
                            p.FirstName == "Updated" && p.Email == "update_me@test.com"
                        )
                    ),
                Times.Once
            );

            RemoveAuthorization();
        }

        [Fact]
        public async Task UpdateUser_NonExistentId_Returns404()
        {
            var updateDto = new UpdateUserDto
            {
                FirstName = "Ghost",
                LastName = "User",
                Email = "ghost@test.com",
                Phone = "0000000000",
            };

            AuthorizeClient();
            var response = await Client.PutAsync("/api/users/999999", Json(updateDto));

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            RemoveAuthorization();
        }

        [Fact]
        public async Task UpdateUser_Unauthenticated_Returns401()
        {
            RemoveAuthorization();
            var updateDto = new UpdateUserDto
            {
                FirstName = "A",
                LastName = "B",
                Email = "x@x.com",
                Phone = "000",
            };
            var response = await Client.PutAsync("/api/users/1", Json(updateDto));
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task UpdateUser_PersistsChangesToDatabase()
        {
            var user = WithDb(db =>
                DatabaseSeeder.AddUser(db, firstName: "Original", email: "persist_update@test.com")
            );

            var updateDto = new UpdateUserDto
            {
                FirstName = "Modified",
                LastName = "Surname",
                Email = "persist_update@test.com",
                Phone = "9990001111",
            };

            AuthorizeClient();
            await Client.PutAsync($"/api/users/{user.Id}", Json(updateDto));

            var updated = WithDbFresh(db => db.Users.Find(user.Id));
            updated!.FirstName.Should().Be("Modified");
            updated.Phone.Should().Be("9990001111");

            RemoveAuthorization();
        }

        [Fact]
        public async Task UpdateUser_SyncPayloadContainsCorrectRoleId()
        {
            // RoleId should be fetched from the existing user (not from the DTO)
            var user = WithDb(db =>
                DatabaseSeeder.AddUser(db, email: "roleid_sync@test.com", roleId: 20)
            ); // AGENT

            var updateDto = new UpdateUserDto
            {
                FirstName = "Agent",
                LastName = "Updated",
                Email = "roleid_sync@test.com",
                Phone = "1234567890",
            };

            AuthorizeClient();
            await Client.PutAsync($"/api/users/{user.Id}", Json(updateDto));

            Factory.PropertyApiMock.Verify(
                x => x.SyncUser(user.Id, It.Is<SyncUserPayload>(p => p.RoleId == 20)),
                Times.Once
            );

            RemoveAuthorization();
        }

        // ── DELETE USER ───────────────────────────────────────────────────────

        [Fact]
        public async Task DeleteUser_ExistingId_Returns200AndCallsPropertyService()
        {
            var user = WithDb(db => DatabaseSeeder.AddUser(db, email: "delete_me@test.com"));

            AuthorizeClient();
            var response = await Client.DeleteAsync($"/api/users/{user.Id}");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var msg = await response.Content.ReadAsStringAsync();
            msg.Should().Contain("deleted successfully");

            Factory.PropertyApiMock.Verify(x => x.DeleteUser(user.Id), Times.Once);
            RemoveAuthorization();
        }

        [Fact]
        public async Task DeleteUser_NonExistentId_Returns404()
        {
            AuthorizeClient();
            var response = await Client.DeleteAsync("/api/users/999999");

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);

            // Property service must NOT be called for a missing user
            Factory.PropertyApiMock.Verify(x => x.DeleteUser(It.IsAny<int>()), Times.Never);
            RemoveAuthorization();
        }

        [Fact]
        public async Task DeleteUser_Unauthenticated_Returns401()
        {
            RemoveAuthorization();
            var response = await Client.DeleteAsync("/api/users/1");
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task DeleteUser_UserNoLongerAccessibleAfterDeletion()
        {
            var user = WithDb(db => DatabaseSeeder.AddUser(db, email: "gone@test.com"));

            AuthorizeClient();
            await Client.DeleteAsync($"/api/users/{user.Id}");

            // GET should now return 404
            var getResponse = await Client.GetAsync($"/api/users/{user.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
            RemoveAuthorization();
        }

        [Fact]
        public async Task DeleteUser_DoesNotDeleteOtherUsers()
        {
            var userA = WithDb(db => DatabaseSeeder.AddUser(db, email: "keepme@test.com"));
            var userB = WithDb(db => DatabaseSeeder.AddUser(db, email: "deleteonlyme@test.com"));

            AuthorizeClient();
            await Client.DeleteAsync($"/api/users/{userB.Id}");

            // userA must still be retrievable
            var getResponse = await Client.GetAsync($"/api/users/{userA.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            RemoveAuthorization();
        }
    }
}
