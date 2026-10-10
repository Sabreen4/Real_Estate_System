using IdentityService.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;
using Xunit;

namespace IdentityService.IntegrationTests.Fixtures
{
    /// <summary>
    /// Custom WebApplicationFactory that:
    ///   - Swaps SQL Server / Postgres with EF Core In-Memory database.
    ///   - Replaces IPropertyApi (Refit/HTTP) with a Moq stub.
    ///   - Forces the "Test" authentication scheme (FakeAuthHandler).
    /// </summary>
    public class IdentityServiceFactory : WebApplicationFactory<Program>
    {
        // Expose the mock so individual tests can set up / verify calls
        public Mock<IPropertyApi> PropertyApiMock { get; } = new Mock<IPropertyApi>();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Tell Program.cs to use the Test authentication scheme
            builder.UseSetting("UseTestAuth", "true");

            builder.ConfigureServices(services =>
            {
                // ── 1. Remove the real DbContext registration ──────────────────────
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.RemoveAll<ApplicationDbContext>();

                // ── 2. Register In-Memory database ────────────────────────────────
                var dbName = $"IdentityServiceTestDb_{Guid.NewGuid()}";
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(dbName)
                );

                // ── 3. Replace Refit IPropertyApi with the Moq instance ──────────
                services.RemoveAll<IPropertyApi>();
                services.AddSingleton(PropertyApiMock.Object);

                // ── 4. Seed the In-Memory DB with reference data ─────────────────
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.EnsureCreated();
                DatabaseSeeder.Seed(db);
            });
        }
    }
}
