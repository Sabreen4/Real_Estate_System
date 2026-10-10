namespace PropertyService.Application.DTOs
{
    public class OfferDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public int UserId { get; set; }
        public decimal OfferAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        public int AgentId { get; set; }
    }
}
