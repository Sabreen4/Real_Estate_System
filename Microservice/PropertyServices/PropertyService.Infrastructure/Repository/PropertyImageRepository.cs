using Microsoft.EntityFrameworkCore;
using PropertyService.Application.Interfaces;
using PropertyService.Domain.Entities;
using PropertyService.Infrastructure.Persistence;

namespace PropertyService.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for managing <see cref="PropertyImage"/> entities.
    /// Handles CRUD operations and queries related to property images.
    /// </summary>
    public class PropertyImageRepository : IPropertyImageRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Constructor to inject the application's DbContext.
        /// </summary>
        /// <param name="context">Database context instance.</param>
        public PropertyImageRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Adds a collection of property images to the database.
        /// </summary>
        /// <param name="images">Collection of <see cref="PropertyImage"/> entities to add.</param>
        public async Task AddRangeAsync(ICollection<PropertyImage> images)
        {
            await _context.PropertyImages.AddRangeAsync(images);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Deletes property images with the specified IDs.
        /// </summary>
        /// <param name="ids">Collection of image IDs to delete.</param>
        public async Task DeleteByIdsAsync(ICollection<int> ids)
        {
            var images = await _context.PropertyImages.Where(i => ids.Contains(i.Id)).ToListAsync();
            _context.PropertyImages.RemoveRange(images);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Retrieves all images associated with a specific property.
        /// </summary>
        /// <param name="propertyId">The ID of the property.</param>
        /// <returns>List of <see cref="PropertyImage"/> entities for the property.</returns>
        public async Task<List<PropertyImage>> GetByPropertyIdAsync(int propertyId)
        {
            return await _context
                .PropertyImages.Where(x => x.PropertyId == propertyId)
                .ToListAsync();
        }

        /// <summary>
        /// Checks whether a property with the given ID exists in the database.
        /// </summary>
        /// <param name="propertyId">The ID of the property to check.</param>
        /// <returns>True if the property exists; otherwise, false.</returns>
        public async Task<bool> PropertyExistsAsync(int propertyId)
        {
            return await _context.Properties.AnyAsync(p => p.Id == propertyId);
        }

        /// <summary>
        /// Persists all changes made in the DbContext to the database.
        /// </summary>
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}