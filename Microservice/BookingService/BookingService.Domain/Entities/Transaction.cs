using BookingService.Domain.Common;

namespace BookingService.Domain.Entities
{
    public class Transaction : BaseEntity
    {
        public int Id { get; set; }

        public int PropertyId { get; set; }

        public int BuyerId { get; set; }

        public int SellerId { get; set; }
       

        public decimal Amount { get; set; }

        public DateTime TransactionDate { get; set; }

        public int StatusId { get; set; }
        public RefTerm Status { get; set; }
    }
}
