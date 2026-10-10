namespace PropertyService.Application.DTOs
{
    public class PropertyImageDto
    {
        public int Id { get; set; }
        public byte[] ImageData { get; set; } = Array.Empty<byte>();

        public string Base64 => Convert.ToBase64String(ImageData);

        public string ContentType { get; set; } = string.Empty;
        public object PropertyId { get; set; }
    }
}
