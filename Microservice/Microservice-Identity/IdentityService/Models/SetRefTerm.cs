using IdentityService.Models;

namespace IdentityService.Models
{
    public class SetRefTerm : BaseEntity
    {
        public int Id { get; set; }

        public int RefSetId { get; set; }
        public RefSet? RefSet { get; set; }

        public int RefTermId { get; set; }
        public RefTerm? RefTerm { get; set; }
    }
}
