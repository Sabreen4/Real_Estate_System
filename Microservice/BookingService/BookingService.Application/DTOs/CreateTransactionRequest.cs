namespace  BookingService.Application.DTOs
{
    public class CreateTransactionRequest
    {
        public int SellerId { get; set; }
        public int PropertyId { get; set; }
        public decimal Amount { get; set; }
        
    }
}