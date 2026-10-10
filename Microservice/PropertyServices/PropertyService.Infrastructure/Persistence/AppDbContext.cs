using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations; //  add this
using PropertyService.Domain.Entities;

namespace PropertyService.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyImage> PropertyImages { get; set; }

        public DbSet<Offer> Offers { get; set; }

        public DbSet<RefSet> RefSets { get; set; }
        public DbSet<RefTerm> RefTerms { get; set; }
        public DbSet<SetRefTerm> SetRefTerms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("Sabreen_PropertyServiceManagement");

            // ── Keys ──────────────────────────────────────────────
            modelBuilder.Entity<User>().HasKey(x => x.Id);
            modelBuilder.Entity<Property>().HasKey(x => x.Id);
            modelBuilder.Entity<PropertyImage>().HasKey(x => x.Id);
            modelBuilder.Entity<Offer>().HasKey(x => x.Id);
            modelBuilder.Entity<RefSet>().HasKey(x => x.Id);
            modelBuilder.Entity<RefTerm>().HasKey(x => x.Id);
            modelBuilder.Entity<SetRefTerm>().HasKey(x => x.Id);

            // ── BaseEntity Properties ─────────────────────────────
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(Domain.Common.BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(
                        entityType.ClrType,
                        b =>
                        {
                            b.Property<DateTime>("CreatedDate")
                                .HasColumnType("timestamp with time zone");
                            b.Property<DateTime?>("UpdatedDate")
                                .HasColumnType("timestamp with time zone");
                            b.Property<bool>("IsDeleted").HasDefaultValue(false);
                            b.Property<bool>("IsActive").HasDefaultValue(true);
                            b.Property<string?>("CreatedBy").HasColumnType("text");
                            b.Property<string?>("UpdatedBy").HasColumnType("text");
                        }
                    );
                }
            }

            // ── PropertyImage ─────────────────────────────────────
            modelBuilder.Entity<PropertyImage>(entity =>
            {
                entity.Property(e => e.ImageData).HasColumnType("bytea");
                entity.Property(e => e.ContentType).HasColumnType("text");
            });

            // ── Decimal Precision ─────────────────────────────────
            modelBuilder.Entity<Property>().Property(p => p.Price).HasColumnType("numeric(18,2)");

            modelBuilder
                .Entity<Offer>()
                .Property(o => o.OfferAmount)
                .HasColumnType("numeric(18,2)");

            // ── SetRefTerm ────────────────────────────────────────
            modelBuilder
                .Entity<SetRefTerm>()
                .HasOne(x => x.RefSet)
                .WithMany(x => x.SetRefTerms)
                .HasForeignKey(x => x.RefSetId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<SetRefTerm>()
                .HasOne(x => x.RefTerm)
                .WithMany(x => x.SetRefTerms)
                .HasForeignKey(x => x.RefTermId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── User ──────────────────────────────────────────────
            modelBuilder
                .Entity<User>()
                .HasOne(u => u.Role)
                .WithMany()
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Property → RefTerm ────────────────────────────────
            modelBuilder
                .Entity<Property>()
                .HasOne(p => p.PropertyType)
                .WithMany()
                .HasForeignKey(p => p.PropertyTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Property>()
                .HasOne(p => p.ListingType)
                .WithMany()
                .HasForeignKey(p => p.ListingTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Property>()
                .HasOne(p => p.Status)
                .WithMany()
                .HasForeignKey(p => p.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Appointment ───────────────────────────────────────

            // ── Offer ─────────────────────────────────────────────
            modelBuilder
                .Entity<Offer>()
                .HasOne(o => o.Status)
                .WithMany()
                .HasForeignKey(o => o.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Transaction ───────────────────────────────────────

            // ── Seed RefSet ───────────────────────────────────────
            modelBuilder
                .Entity<RefSet>()
                .HasData(
                    new RefSet
                    {
                        Id = 1,
                        Key = "ROLE",
                        Description = "User Roles",
                    },
                    new RefSet
                    {
                        Id = 2,
                        Key = "PROPERTY_TYPE",
                        Description = "Property Types",
                    },
                    new RefSet
                    {
                        Id = 3,
                        Key = "LISTING_TYPE",
                        Description = "Listing Types",
                    },
                    new RefSet
                    {
                        Id = 4,
                        Key = "STATUS",
                        Description = "Status Values",
                    }
                );

            // ── Seed RefTerm ──────────────────────────────────────
            modelBuilder
                .Entity<RefTerm>()
                .HasData(
                    // Roles
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
                    },
                    // Property Types
                    new RefTerm
                    {
                        Id = 40,
                        Key = "APARTMENT",
                        Description = "Apartment",
                    },
                    new RefTerm
                    {
                        Id = 50,
                        Key = "HOUSE",
                        Description = "House",
                    },
                    new RefTerm
                    {
                        Id = 60,
                        Key = "COMMERCIAL",
                        Description = "Commercial",
                    },
                    // Listing Types
                    new RefTerm
                    {
                        Id = 70,
                        Key = "FOR_SALE",
                        Description = "For Sale",
                    },
                    new RefTerm
                    {
                        Id = 80,
                        Key = "FOR_RENT",
                        Description = "For Rent",
                    },
                    new RefTerm
                    {
                        Id = 90,
                        Key = "LEASE",
                        Description = "Lease",
                    },
                    // Status
                    new RefTerm
                    {
                        Id = 100,
                        Key = "ACTIVE",
                        Description = "Active",
                    },
                    new RefTerm
                    {
                        Id = 200,
                        Key = "PENDING",
                        Description = "Pending",
                    },
                    new RefTerm
                    {
                        Id = 300,
                        Key = "SOLD",
                        Description = "Sold",
                    },
                    new RefTerm
                    {
                        Id = 400,
                        Key = "APPROVED",
                        Description = "Approved",
                    },
                    new RefTerm
                    {
                        Id = 500,
                        Key = "REJECTED",
                        Description = "Rejected",
                    }
                );

            // ── Seed SetRefTerm ───────────────────────────────────
            modelBuilder
                .Entity<SetRefTerm>()
                .HasData(
                    // ROLE group
                    new SetRefTerm
                    {
                        Id = 1001,
                        RefSetId = 1,
                        RefTermId = 10,
                    },
                    new SetRefTerm
                    {
                        Id = 1002,
                        RefSetId = 1,
                        RefTermId = 20,
                    },
                    new SetRefTerm
                    {
                        Id = 1003,
                        RefSetId = 1,
                        RefTermId = 30,
                    },
                    // PROPERTY_TYPE group
                    new SetRefTerm
                    {
                        Id = 1004,
                        RefSetId = 2,
                        RefTermId = 40,
                    },
                    new SetRefTerm
                    {
                        Id = 1005,
                        RefSetId = 2,
                        RefTermId = 50,
                    },
                    new SetRefTerm
                    {
                        Id = 1006,
                        RefSetId = 2,
                        RefTermId = 60,
                    },
                    // LISTING_TYPE group
                    new SetRefTerm
                    {
                        Id = 1007,
                        RefSetId = 3,
                        RefTermId = 70,
                    },
                    new SetRefTerm
                    {
                        Id = 1008,
                        RefSetId = 3,
                        RefTermId = 80,
                    },
                    new SetRefTerm
                    {
                        Id = 1009,
                        RefSetId = 3,
                        RefTermId = 90,
                    },
                    // STATUS group
                    new SetRefTerm
                    {
                        Id = 1010,
                        RefSetId = 4,
                        RefTermId = 100,
                    },
                    new SetRefTerm
                    {
                        Id = 1011,
                        RefSetId = 4,
                        RefTermId = 200,
                    },
                    new SetRefTerm
                    {
                        Id = 1012,
                        RefSetId = 4,
                        RefTermId = 300,
                    },
                    new SetRefTerm
                    {
                        Id = 1013,
                        RefSetId = 4,
                        RefTermId = 400,
                    },
                    new SetRefTerm
                    {
                        Id = 1014,
                        RefSetId = 4,
                        RefTermId = 500,
                    }
                );
        }
    }
}
