// Models/OtpVerification.cs
public class OtpVerification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Otp { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Remove "public User? User { get; set; }" — not needed
}