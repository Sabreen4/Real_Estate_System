namespace PropertyService.Application.DTOs
{
    public class CreatePropertyRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;

        public decimal Price { get; set; }
        public int Size { get; set; }

        public int PropertyTypeId { get; set; }
        public int ListingTypeId { get; set; }
        public int StatusId { get; set; }
        //  Images removed — use the dedicated /api/property-images endpoint
    }
}