using IdentityService.Data;
using IdentityService.Models;

namespace IdentityService.IntegrationTests.Fixtures
{
    public static class DatabaseSeeder
    {
        // ── Reference data ────────────────────────────────────────────────────

        public static void Seed(ApplicationDbContext db)
        {
            if (db.RefSets.Any())
                return;

            var roleRefSet = new RefSet
            {
                Id = 100,
                Key = "ROLE",
                Description = "User Roles",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };
            db.RefSets.Add(roleRefSet);

            var adminRole = new RefTerm
            {
                Id = 10,
                Key = "ADMIN",
                Description = "Administrator",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };
            var agentRole = new RefTerm
            {
                Id = 20,
                Key = "AGENT",
                Description = "Agent/Seller",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };
            var buyerRole = new RefTerm
            {
                Id = 30,
                Key = "BUYER",
                Description = "Buyer/Renter",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };
            db.RefTerms.AddRange(adminRole, agentRole, buyerRole);

            db.SetRefTerms.AddRange(
                new SetRefTerm
                {
                    Id = 1,
                    RefSetId = 100,
                    RefTermId = 10,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow,
                },
                new SetRefTerm
                {
                    Id = 2,
                    RefSetId = 100,
                    RefTermId = 20,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow,
                },
                new SetRefTerm
                {
                    Id = 3,
                    RefSetId = 100,
                    RefTermId = 30,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow,
                }
            );

            db.SaveChanges();
        }

        // ── User factory ──────────────────────────────────────────────────────

        /// <summary>
        /// Ensures reference data exists, then adds and returns a user.
        /// Safe to call from any test regardless of whether Seed() ran first.
        /// </summary>
        public static User AddUser(
            ApplicationDbContext db,
            string firstName = "John",
            string lastName = "Doe",
            string email = "john@test.com",
            string plainPassword = "Password@123",
            int roleId = 10
        )
        {
            // Guarantee the roleId being used actually exists in RefTerms.
            // Seed() is idempotent so calling it here is always safe.
            Seed(db);

            if (!db.RefTerms.Any(r => r.Id == roleId))
                throw new InvalidOperationException(
                    $"roleId {roleId} does not exist in RefTerms. "
                        + $"Valid ids are 10 (ADMIN), 20 (AGENT), 30 (BUYER)."
                );

            var user = new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword),
                Phone = "9876543210",
                RoleId = roleId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };

            db.Users.Add(user);
            db.SaveChanges();
            return user;
        }
    }
}
