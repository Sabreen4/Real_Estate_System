using Microsoft.EntityFrameworkCore;
using BookingService.Domain.Entities;

namespace BookingService.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Appointment> Appointments { get; set; }

        public DbSet<Transaction> Transactions { get; set; }

        public DbSet<RefSet> RefSets { get; set; }

        public DbSet<RefTerm> RefTerms { get; set; }

        public DbSet<SetRefTerm> SetRefTerms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("Sabreen_BookingService");

            // ── Keys ─────────────────────────────

            modelBuilder.Entity<Appointment>().HasKey(x => x.Id);
            modelBuilder.Entity<Transaction>().HasKey(x => x.Id);
            modelBuilder.Entity<RefSet>().HasKey(x => x.Id);
            modelBuilder.Entity<RefTerm>().HasKey(x => x.Id);
            modelBuilder.Entity<SetRefTerm>().HasKey(x => x.Id);

            // ── BaseEntity Properties ───────────

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

            // ── Decimal Precision ───────────────

            modelBuilder
                .Entity<Transaction>()
                .Property(t => t.Amount)
                .HasColumnType("numeric(18,2)");

            // ── SetRefTerm Relations ───────────

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

            // ── Appointment Status ─────────────

            modelBuilder
                .Entity<Appointment>()
                .HasOne(a => a.Status)
                .WithMany()
                .HasForeignKey(a => a.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Transaction Status ─────────────

            modelBuilder
                .Entity<Transaction>()
                .HasOne(t => t.Status)
                .WithMany()
                .HasForeignKey(t => t.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Seed RefSet ────────────────────

            modelBuilder
                .Entity<RefSet>()
                .HasData(
                    new RefSet
                    {
                        Id = 4,
                        Key = "STATUS",
                        Description = "Status Values",
                    }
                );

            // ── Seed RefTerm ───────────────────

            modelBuilder
                .Entity<RefTerm>()
                .HasData(
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

            // ── Seed SetRefTerm ────────────────

            modelBuilder
                .Entity<SetRefTerm>()
                .HasData(
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
