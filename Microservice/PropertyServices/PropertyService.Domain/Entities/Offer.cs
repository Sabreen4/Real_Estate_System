using PropertyService.Domain.Common;

namespace PropertyService.Domain.Entities
{
    public class Offer : BaseEntity
    {
        public int Id { get; set; }

        public int PropertyId { get; set; }
        public Property Property { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public decimal OfferAmount { get; set; }

        public int StatusId { get; set; }
        public RefTerm Status { get; set; }
    }
}
