using PropertyService.Domain.Common;

namespace PropertyService.Domain.Entities
{
    public class RefTerm : BaseEntity
    {
        public int Id { get; set; }

        public string Key { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<SetRefTerm> SetRefTerms { get; set; } = new List<SetRefTerm>();
    }
}
