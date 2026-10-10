using BookingService.Domain.Common;

namespace BookingService.Domain.Entities
{
    public class Appointment : BaseEntity
    {
        public int Id { get; set; }

        public int PropertyId { get; set; }
       

        public int UserId { get; set; }
       public int AgentId    { get; set; } 

        public DateTime VisitDate { get; set; }

        public int StatusId { get; set; }
        public RefTerm Status { get; set; }
    }
}
