namespace PropertyService.Application.DTOs;

public class UserDto
{
    public int Id { get; init; }
    public int RoleId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
