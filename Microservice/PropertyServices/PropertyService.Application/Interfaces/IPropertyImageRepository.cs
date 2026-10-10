using PropertyService.Domain.Entities;

namespace PropertyService.Application.Interfaces
{
    public interface IPropertyImageRepository
    {
        Task AddRangeAsync(ICollection<PropertyImage> images);

        Task DeleteByIdsAsync(ICollection<int> ids);

        Task<List<PropertyImage>> GetByPropertyIdAsync(int propertyId);

        Task<bool> PropertyExistsAsync(int propertyId);

        Task SaveChangesAsync();
    }
}