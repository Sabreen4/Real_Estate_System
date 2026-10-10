namespace PropertyService.Application.DTOs
{
    
    public class ImageUploadDto
    {
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "image/jpeg";
    }
}