using IdentityService.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        // Your Tables
        public DbSet<User> Users { get; set; }

        public DbSet<RefSet> RefSets { get; set; }

        public DbSet<RefTerm> RefTerms { get; set; }

        public DbSet<SetRefTerm> SetRefTerms { get; set; }

        public DbSet<OtpVerification> OtpVerifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Set PostgreSQL Schema
            builder.HasDefaultSchema("Sabreen_IdentityService");
            // Seed RefSet (Role Category)
            builder
                .Entity<RefSet>()
                .HasData(
                    new RefSet
                    {
                        Id = 100,
                        Key = "ROLE",
                        Description = "User Roles",
                    }
                );

            // Seed RefTerm (Roles)
            builder
                .Entity<RefTerm>()
                .HasData(
                    new RefTerm
                    {
                        Id = 10,
                        Key = "ADMIN",
                        Description = "Administrator",
                    },
                    new RefTerm
                    {
                        Id = 20,
                        Key = "AGENT",
                        Description = "Agent/Seller",
                    },
                    new RefTerm
                    {
                        Id = 30,
                        Key = "BUYER",
                        Description = "Buyer/Renter",
                    }
                );

            // Seed SetRefTerm (Mapping)
            builder
                .Entity<SetRefTerm>()
                .HasData(
                    new SetRefTerm
                    {
                        Id = 1,
                        RefSetId = 100,
                        RefTermId = 10,
                    },
                    new SetRefTerm
                    {
                        Id = 2,
                        RefSetId = 100,
                        RefTermId = 20,
                    },
                    new SetRefTerm
                    {
                        Id = 3,
                        RefSetId = 100,
                        RefTermId = 30,
                    }
                );

            // Configure User table
            builder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);

                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);

                entity.Property(u => u.LastName).HasMaxLength(100);

                entity.Property(u => u.Email).IsRequired();

                entity.Property(u => u.PasswordHash).IsRequired();

                entity.HasOne(u => u.Role).WithMany().HasForeignKey(u => u.RoleId);
                entity.HasIndex(u => u.Email).IsUnique();
            });
            builder.Entity<OtpVerification>(entity =>
            {
                entity.ToTable("otp_verifications", "Sabreen_IdentityService");
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Id).HasColumnName("id");
                entity.Property(o => o.UserId).HasColumnName("user_id");
                entity.Property(o => o.Otp).HasColumnName("otp").IsRequired().HasMaxLength(6);
                entity.Property(o => o.ExpiresAt).HasColumnName("expires_at").IsRequired();
                entity.Property(o => o.CreatedAt).HasColumnName("created_at");
                entity.HasIndex(o => o.UserId).IsUnique();
            });
        }
    }
}
