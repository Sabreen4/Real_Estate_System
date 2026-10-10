using PropertyService.Domain.Common;

namespace PropertyService.Domain.Entities
{
    public class PropertyImage : BaseEntity
    {
        public int Id { get; set; }

        public int PropertyId { get; set; }
        public Property Property { get; set; }

        public byte[] ImageData { get; set; }  // stores image file
        public string ContentType { get; set; } // e.g., "image/jpeg"
    }
}