namespace BookingService.Application.DTOs
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public int UserId { get; set; }
        public DateTime VisitDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
