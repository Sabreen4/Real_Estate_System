namespace BookingService.Application.DTOs
{
    public class TransactionDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public int BuyerId { get; set; }
        public int SellerId { get; set; }
        public decimal Amount { get; set; }

        public string Status { get; set; } = string.Empty;
       public DateTime PaymentDate { get; set; }
    }
}
