namespace BookingService.Application.DTOs
{
    public class CreateAppointmentRequest
    {
         public int UserId { get; set; }
        public int PropertyId { get; set; }
        public DateTime VisitDate { get; set; }
    }
}
