using AutoMapper;
using PropertyService.Application.DTOs;
using PropertyService.Domain.Entities;

namespace PropertyService.Application.Mappings
{
    public class PropertyMappingProfile : Profile
    {
        public PropertyMappingProfile()
        {
            CreateMap<CreatePropertyRequestDto, Property>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyType, opt => opt.Ignore())
                .ForMember(dest => dest.ListingType, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.Offers, opt => opt.Ignore());

            CreateMap<UpdatePropertyRequestDto, Property>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyType, opt => opt.Ignore())
                .ForMember(dest => dest.ListingType, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.Offers, opt => opt.Ignore());

            CreateMap<Property, PropertyResponseDto>()
                .ForMember(
                    dest => dest.PropertyType,
                    opt =>
                        opt.MapFrom(src =>
                            src.PropertyType != null ? src.PropertyType.Key : string.Empty
                        )
                )
                .ForMember(
                    dest => dest.ListingType,
                    opt =>
                        opt.MapFrom(src =>
                            src.ListingType != null ? src.ListingType.Key : string.Empty
                        )
                )
                .ForMember(
                    dest => dest.Status,
                    opt => opt.MapFrom(src => src.Status != null ? src.Status.Key : string.Empty)
                )
                // FIX: Use AutoMapper's existing PropertyImage → PropertyImageDto map
                // instead of manually projecting (which was skipping ImageData)
                .ForMember(
                    dest => dest.Images,
                    opt => opt.MapFrom(src => src.Images ?? new List<PropertyImage>())
                );

            CreateMap<Property, PropertySummaryDto>()
                .ForMember(
                    dest => dest.PropertyTypeName,
                    opt =>
                        opt.MapFrom(src =>
                            src.PropertyType != null ? src.PropertyType.Key : string.Empty
                        )
                )
                .ForMember(
                    dest => dest.ListingTypeName,
                    opt =>
                        opt.MapFrom(src =>
                            src.ListingType != null ? src.ListingType.Key : string.Empty
                        )
                );

            // This mapping is correct — AutoMapper will use it automatically above
            CreateMap<PropertyImage, PropertyImageDto>()
                .ForMember(
                    dest => dest.Base64,
                    opt =>
                        opt.MapFrom(src =>
                            src.ImageData != null && src.ImageData.Length > 0
                                ? Convert.ToBase64String(src.ImageData)
                                : string.Empty
                        )
                )
                .ForMember(dest => dest.ContentType, opt => opt.MapFrom(src => src.ContentType));
        }
    }
}
