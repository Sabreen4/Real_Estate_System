using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using IdentityService.Data;
using IdentityService.IntegrationTests.Fixtures;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace IdentityService.IntegrationTests.Helpers
{
    public class IntegrationTestBase : IClassFixture<IdentityServiceFactory>, IAsyncLifetime
    {
        protected readonly HttpClient Client;
        protected readonly IdentityServiceFactory Factory;

        private IServiceScope _scope = null!;
        private ApplicationDbContext _db = null!;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        public IntegrationTestBase(IdentityServiceFactory factory)
        {
            Factory = factory;
            Client = factory.CreateClient();
        }

        // ── xUnit lifecycle ───────────────────────────────────────────────────

        public Task InitializeAsync()
        {
            // Fresh DB scope + re-seed before every test
            _scope = Factory.Services.CreateScope();
            _db = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            _db.Database.EnsureDeleted();
            _db.Database.EnsureCreated();
            DatabaseSeeder.Seed(_db);

            // Always start each test unauthenticated;
            // individual tests call AuthorizeClient() when needed
            RemoveAuthorization();

            return Task.CompletedTask;
        }

        public Task DisposeAsync()
        {
            _scope.Dispose();
            return Task.CompletedTask;
        }

        // ── Auth helpers ──────────────────────────────────────────────────────

        /// <summary>
        /// Adds the fake auth header that FakeAuthHandler accepts.
        /// Pass a custom token string if a test needs a specific value.
        /// </summary>
        protected void AuthorizeClient(string token = "Test")
        {
            Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Test",
                token
            );
        }

        protected void RemoveAuthorization()
        {
            Client.DefaultRequestHeaders.Authorization = null;
        }

        // ── DB helper ─────────────────────────────────────────────────────────

        /// <summary>
        /// Runs an action (or func) against the shared in-memory DbContext.
        /// Returns the result so callers can capture seeded entities:
        ///   var user = WithDb(db => DatabaseSeeder.AddUser(db, email: "x@test.com"));
        /// </summary>
        protected T WithDb<T>(Func<ApplicationDbContext, T> action) => action(_db);

        protected void WithDb(Action<ApplicationDbContext> action) => action(_db);

        protected T WithDbFresh<T>(Func<ApplicationDbContext, T> action)
        {
            _db.ChangeTracker.Clear();
            return action(_db);
        }

        // ── Serialization helpers ─────────────────────────────────────────────

        /// <summary>Serializes <paramref name="payload"/> to a JSON StringContent.</summary>
        protected static StringContent Json<T>(T payload) =>
            new(JsonSerializer.Serialize(payload, _jsonOptions), Encoding.UTF8, "application/json");

        /// <summary>
        /// Reads the response body and deserializes it as <typeparamref name="T"/>.
        /// Throws a descriptive exception when the status code is not a success
        /// so tests fail with the actual error body instead of a cryptic JSON parse error.
        /// </summary>
        protected async Task<T?> Deserialize<T>(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"Request failed with {(int)response.StatusCode} {response.StatusCode}. "
                        + $"Body: {content}"
                );

            return JsonSerializer.Deserialize<T>(content, _jsonOptions);
        }
    }
}
