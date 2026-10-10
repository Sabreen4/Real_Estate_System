using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Domain.Entities;

namespace BookingService.Application.Mappings
{
    public class TransactionProfile : Profile
    {
        public TransactionProfile()
        {
            CreateMap<Transaction, TransactionDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.Key))
                  .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => src.TransactionDate));
        }
    }
}
