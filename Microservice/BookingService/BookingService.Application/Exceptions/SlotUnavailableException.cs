// BookingService.Application/Exceptions/SlotUnavailableException.cs
namespace BookingService.Application.Exceptions
{
    public class SlotUnavailableException : Exception
    {
        public SlotUnavailableException(string message) : base(message) { }
    }
}