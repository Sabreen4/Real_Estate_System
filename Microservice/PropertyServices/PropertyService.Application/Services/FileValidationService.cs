using Microsoft.AspNetCore.Http;
using PropertyService.Application.Interfaces;

namespace PropertyService.Application.Services
{
    public class FileValidationService : IFileValidationService
    {
        private readonly FileValidationOptions _defaultOptions;

        public FileValidationService(FileValidationOptions defaultOptions)
        {
            _defaultOptions = defaultOptions;
        }

        public (bool IsValid, string? ErrorMessage) ValidateFiles(
            List<IFormFile> files,
            FileValidationOptions? options = null
        )
        {
            var opts = options ?? _defaultOptions;

            if (files.Count > opts.MaxFileCount)
                return (false, $"Cannot upload more than {opts.MaxFileCount} files at once.");

            foreach (var file in files)
            {
                if (file.Length == 0)
                    return (false, $"File '{file.FileName}' is empty.");

                if (file.Length > opts.MaxFileSizeBytes)
                    return (
                        false,
                        $"File '{file.FileName}' exceeds the maximum allowed size of "
                            + $"{opts.MaxFileSizeBytes / (1024 * 1024)}MB."
                    );

                // Step 1: Validate declared MIME type against allowlist
                if (!opts.AllowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
                    return (
                        false,
                        $"File '{file.FileName}' has an unsupported type '{file.ContentType}'. "
                            + $"Allowed types: {string.Join(", ", opts.AllowedMimeTypes)}."
                    );

                // Step 2: Validate actual file content via magic bytes (defeats spoofing)
                if (!HasValidMagicBytes(file, file.ContentType.ToLowerInvariant()))
                    return (
                        false,
                        $"File '{file.FileName}' content does not match its declared type "
                            + $"'{file.ContentType}'. Possible content-type spoofing attempt."
                    );
            }

            return (true, null);
        }

        private static bool HasValidMagicBytes(IFormFile file, string contentType)
        {
            if (!FileValidationOptions.MagicBytes.TryGetValue(contentType, out var signatures))
                return false;

            int maxSignatureLength = signatures.Max(s => s.Length);
            Span<byte> header = stackalloc byte[maxSignatureLength];

            using var stream = file.OpenReadStream();
            int bytesRead = stream.Read(header);

            if (bytesRead < maxSignatureLength)
                return false;

            foreach (var sig in signatures)
            {
                if (header[..sig.Length].SequenceEqual(sig))
                    return true;
            }

            return false;
        }
    }
}
