namespace PropertyService.Application.DTOs

{
    public class PropertyResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;

        public decimal Price { get; set; }
        public int Size { get; set; }

        public int PropertyTypeId { get; set; }
        public string PropertyType { get; set; } = string.Empty;

        public int ListingTypeId { get; set; }
        public string ListingType { get; set; } = string.Empty;

        public int StatusId { get; set; }
        public string Status { get; set; } = string.Empty;

        public ICollection<PropertyImageDto> Images { get; set; } = new List<PropertyImageDto>();
    }
}