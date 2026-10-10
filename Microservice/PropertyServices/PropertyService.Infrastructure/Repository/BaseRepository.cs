// Infrastructure/Repositories/BaseRepository.cs
using Microsoft.EntityFrameworkCore;
using PropertyService.Domain.Entities;
using PropertyService.Infrastructure.Persistence;

namespace PropertyService.Infrastructure.Repositories
{
    public abstract class BaseRepository<T>
        where T : class
    {
        protected readonly AppDbContext _context;

        public BaseRepository(AppDbContext context) // ← requires context
        {
            _context = context;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

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
