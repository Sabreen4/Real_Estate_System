using AutoMapper;
using PropertyService.Application.DTOs;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Mappings
{
    public class OfferProfile : Profile
    {
        public OfferProfile()
        {
            CreateMap<Offer, OfferDto>()
                .ForMember(dest => dest.Status,
                    opt => opt.MapFrom(src => src.Status.Key));
        }
    }
}