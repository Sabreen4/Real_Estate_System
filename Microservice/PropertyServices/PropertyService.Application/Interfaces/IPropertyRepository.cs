using PropertyService.Domain.Entities;

namespace PropertyService.Application.Interfaces
{
    public interface IPropertyRepository
    {
        Task<Property> AddAsync(Property property);
        Task<Property> UpdateAsync(Property property);
        Task DeleteAsync(Property property);
        Task<Property?> GetByIdAsync(int id);

        Task<RefTerm?> GetStatusByKeyAsync(string key);

        // New: Get all properties with optional filtering
        Task<List<Property>> GetAllAsync(
            string? city = null,
            string? propertyType = null,
            string? listingType = null
        );

        // Existing: filtered + paginated
        Task<(List<Property> Items, int TotalCount)> GetFilteredAsync(
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
        );

        // inside IPropertyRepository
        Task<RefTerm?> GetPropertyTypeByKeyAsync(string key);
        Task<RefTerm?> GetListingTypeByKeyAsync(string key);
        Task SaveChangesAsync();
    }
}
