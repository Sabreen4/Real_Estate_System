namespace PropertyService.Application.DTOs;

public class ErrorResponseDto
{
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
}
