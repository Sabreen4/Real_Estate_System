using Refit;

public interface IPropertyApi
{
    [Post("/api/users/sync/{userId}")]
    Task SyncUser(
        int userId,
        [Body] SyncUserPayload payload,
        [Header("Authorization")] string token
    );

    [Delete("/api/users/{userId}")]
    Task DeleteUser(int userId);
}

public class SyncUserPayload
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
