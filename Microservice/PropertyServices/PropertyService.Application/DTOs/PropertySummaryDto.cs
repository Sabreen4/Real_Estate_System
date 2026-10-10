namespace PropertyService.Application.DTOs
{
    public class PropertySummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string PropertyTypeName { get; set; } = string.Empty;
        public string ListingTypeName { get; set; } = string.Empty;
    }
}