using System.ComponentModel.DataAnnotations;

namespace PropertyService.Application.DTOs
{
    /// <summary>
    /// DTO received by the Application layer for updates.
    /// NewImages are already converted to byte[] by the Controller.
    /// </summary>
    public class UpdatePropertyRequestDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Size { get; set; }
        public int PropertyTypeId { get; set; }
        public int ListingTypeId { get; set; }
        public int StatusId { get; set; }

        // byte[] new images — populated by the Controller before sending the command
        public ICollection<ImageUploadDto>? NewImages { get; set; }

        // IDs of existing images to delete
        public ICollection<int>? RemoveImageIds { get; set; }
    }
}
