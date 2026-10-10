using AutoMapper;
using PropertyService.Application.DTOs;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Mappings
{
    public class PropertyImageProfile : Profile
    {
        public PropertyImageProfile()
        {
            CreateMap<PropertyImage, PropertyImageDto>();
        }
    }
}
