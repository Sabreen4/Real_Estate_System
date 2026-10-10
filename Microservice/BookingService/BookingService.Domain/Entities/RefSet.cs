using BookingService.Domain.Common;

namespace BookingService.Domain.Entities
{
    public class RefSet : BaseEntity
    {
        public int Id { get; set; }

        public string Key { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<SetRefTerm> SetRefTerms { get; set; }
            = new List<SetRefTerm>();
    }
}