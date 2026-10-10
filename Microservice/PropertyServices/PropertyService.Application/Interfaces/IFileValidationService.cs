// RealEstateManagementSystem.Application/Interfaces/IFileValidationService.cs

using Microsoft.AspNetCore.Http;
using PropertyService.Application.Services;

namespace PropertyService.Application.Interfaces
{
    public interface IFileValidationService
    {
        (bool IsValid, string? ErrorMessage) ValidateFiles(
            List<IFormFile> files,
            FileValidationOptions? options = null
        );
    }
}
