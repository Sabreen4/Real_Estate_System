// BookingService.Infrastructure/Repositories/BaseRepository.cs

using BookingService.Domain.Entities;
using BookingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Infrastructure.Repositories
{
    /// <summary>
    /// Generic base repository providing common database operations.
    /// </summary>
    public abstract class BaseRepository<T>
        where T : class
    {
        protected readonly AppDbContext _context;

        public BaseRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Persists all changes made in the DbContext to the database.
        /// </summary>
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Retrieves a reference term for a given RefSet key and RefTerm key.
        /// </summary>
        // BaseRepository.cs
        public async Task<RefTerm?> GetStatusByKeyAsync(string key)
        {
            return await _context
                .SetRefTerms.Where(srt =>
                    srt.RefSet.Key.ToUpper() == "STATUS"
                    && srt.RefTerm.Key.ToUpper() == key.ToUpper()
                )
                .Select(srt => srt.RefTerm)
                .FirstOrDefaultAsync();
        }
    }
}
