using PropertyService.Domain.Common;

namespace PropertyService.Domain.Entities
{
    public class Property : BaseEntity
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public string Title { get; set; }
        public string Description { get; set; }

        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }

        public decimal Price { get; set; }
        public int Size { get; set; }

        public int PropertyTypeId { get; set; }
        public RefTerm PropertyType { get; set; }

        public int ListingTypeId { get; set; }
        public RefTerm ListingType { get; set; }

        public int StatusId { get; set; }
        public RefTerm Status { get; set; }

        public ICollection<PropertyImage> Images { get; set; }
       
        public ICollection<Offer> Offers { get; set; }
    }
}