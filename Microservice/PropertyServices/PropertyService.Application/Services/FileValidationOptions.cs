using Microsoft.AspNetCore.Http;

namespace PropertyService.Application.Services
{
    public class FileValidationOptions
    {
        public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024; // 5MB default
        public int MaxFileCount { get; set; } = 10;
        public string[] AllowedMimeTypes { get; set; } =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

        // Magic bytes for each allowed MIME type - prevents content-type spoofing
        public static readonly Dictionary<string, byte[][]> MagicBytes = new()
        {
            ["image/jpeg"] =
            [
                [0xFF, 0xD8, 0xFF],
            ],
            ["image/png"] =
            [
                [0x89, 0x50, 0x4E, 0x47],
            ],
            ["image/webp"] =
            [
                [0x52, 0x49, 0x46, 0x46],
            ], // "RIFF" header
            ["image/gif"] =
            [
                [0x47, 0x49, 0x46, 0x38],
            ], // "GIF8" header
        };
    }
}