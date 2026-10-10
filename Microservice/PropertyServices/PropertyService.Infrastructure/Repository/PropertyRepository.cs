using Microsoft.EntityFrameworkCore;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using PropertyService.Infrastructure.Persistence;

namespace PropertyService.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for managing <see cref="Property"/> entities.
    /// Handles CRUD operations, filtering, and reference term lookups.
    /// </summary>
    public class PropertyRepository : BaseRepository<Property>, IPropertyRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Constructor to inject the application's DbContext.
        /// </summary>
        /// <param name="context">Database context instance.</param>
        public PropertyRepository(AppDbContext context)
            : base(context)
        {
            _context = context;
        }

        /// <summary>
        /// Adds a new property to the database.
        /// </summary>
        /// <param name="property">The property entity to add.</param>
        /// <returns>The added <see cref="Property"/> entity.</returns>
        public async Task<Property> AddAsync(Property property)
        {
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            return property;
        }

        /// <summary>
        /// Updates an existing property in the database.
        /// </summary>
        /// <param name="property">The property entity with updated values.</param>
        /// <returns>The updated <see cref="Property"/> entity.</returns>
        public async Task<Property> UpdateAsync(Property property)
        {
            _context.Properties.Update(property);
            await _context.SaveChangesAsync();
            return property;
        }

        /// <summary>
        /// Deletes a property from the database.
        /// </summary>
        /// <param name="property">The property entity to delete.</param>
        public async Task DeleteAsync(Property property)
        {
            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Retrieves a property by its ID, including related images, property type, listing type, and status.
        /// </summary>
        /// <param name="id">The ID of the property.</param>
        /// <returns>The <see cref="Property"/> entity if found; otherwise, null.</returns>
        public async Task<Property?> GetByIdAsync(int id)
        {
            return await _context
                .Properties.Include(p => p.Images)
                .Include(p => p.PropertyType)
                .Include(p => p.ListingType)
                .Include(p => p.Status)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        /// <summary>
        /// Retrieves a filtered and paginated list of properties.
        /// </summary>
        /// <param name="city">Filter by city (optional).</param>
        /// <param name="state">Filter by state (optional).</param>
        /// <param name="minPrice">Minimum price filter (optional).</param>
        /// <param name="maxPrice">Maximum price filter (optional).</param>
        /// <param name="propertyTypeId">Filter by property type ID (optional).</param>
        /// <param name="listingTypeId">Filter by listing type ID (optional).</param>
        /// <param name="statusId">Filter by status ID (optional).</param>
        /// <param name="pageNumber">Page number for pagination (default: 1).</param>
        /// <param name="pageSize">Page size for pagination (default: 10).</param>
        /// <returns>A tuple containing the list of filtered properties and the total count.</returns>
        public async Task<(List<Property> Items, int TotalCount)> GetFilteredAsync(
            string? city = null,
            string? state = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            int? propertyTypeId = null,
            int? listingTypeId = null,
            int? statusId = null,
            int pageNumber = 1,
            int pageSize = 10,
            int? userId = null
        )
        {
            var query = _context
                .Properties.Include(p => p.Images)
                .Include(p => p.PropertyType)
                .Include(p => p.ListingType)
                .Include(p => p.Status)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(p => EF.Functions.Like(p.City, $"%{city}%"));

            if (!string.IsNullOrWhiteSpace(state))
                query = query.Where(p => EF.Functions.Like(p.State, $"%{state}%"));

            if (minPrice.HasValue)
                query = query.Where(p => p.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => p.Price <= maxPrice.Value);

            if (propertyTypeId.HasValue)
                query = query.Where(p => p.PropertyTypeId == propertyTypeId.Value);

            if (listingTypeId.HasValue)
                query = query.Where(p => p.ListingTypeId == listingTypeId.Value);

            if (statusId.HasValue)
                query = query.Where(p => p.StatusId == statusId.Value);
            if (userId.HasValue)
                query = query.Where(p => p.UserId == userId.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(p => p.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <summary>
        /// Retrieves a reference term for a property type by its key.
        /// </summary>
        /// <param name="key">The key of the property type.</param>
        /// <returns>The <see cref="RefTerm"/> entity if found; otherwise, null.</returns>
        public async Task<RefTerm?> GetPropertyTypeByKeyAsync(string key)
        {
            return await _context
                .SetRefTerms.Where(srt =>
                    srt.RefSet.Key == "PROPERTY_TYPE" && srt.RefTerm.Key.ToLower() == key.ToLower()
                )
                .Select(srt => srt.RefTerm)
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Retrieves a reference term for a listing type by its key.
        /// </summary>
        /// <param name="key">The key of the listing type.</param>
        /// <returns>The <see cref="RefTerm"/> entity if found; otherwise, null.</returns>
        public async Task<RefTerm?> GetListingTypeByKeyAsync(string key)
        {
            return await _context
                .SetRefTerms.Where(srt =>
                    srt.RefSet.Key == "LISTING_TYPE" && srt.RefTerm.Key.ToLower() == key.ToLower()
                )
                .Select(srt => srt.RefTerm)
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Retrieves all properties with optional filtering by city, property type, or listing type.
        /// Not implemented.
        /// </summary>
        public async Task<List<Property>> GetAllAsync(
            string? city = null,
            string? propertyType = null,
            string? listingType = null
        )
        {
            var query = _context
                .Properties.Include(p => p.Images)
                .Include(p => p.PropertyType)
                .Include(p => p.ListingType)
                .Include(p => p.Status)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(p => EF.Functions.Like(p.City, $"%{city}%"));

            if (!string.IsNullOrWhiteSpace(propertyType))
                query = query.Where(p => p.PropertyType.Key == propertyType);

            if (!string.IsNullOrWhiteSpace(listingType))
                query = query.Where(p => p.ListingType.Key == listingType);

            return await query.OrderByDescending(p => p.CreatedDate).ToListAsync();
        }

        /// <summary>
        /// Persists all changes made in the DbContext to the database.
        /// </summary>
    }
}
