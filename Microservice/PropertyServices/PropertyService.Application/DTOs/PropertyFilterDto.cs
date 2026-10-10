namespace PropertyService.Application.DTOs
{
    public class PropertyFilterDto
    {
        public string? City { get; set; }
        public string? State { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? PropertyTypeId { get; set; }
        public string? PropertyTypeName { get; set; } // optional convenience

        public int? ListingTypeId { get; set; }
        public string? ListingTypeName { get; set; } // optional convenience

        public int? StatusId { get; set; }
        public int? UserId { get; set; } // ← ADD THIS
    }
}
