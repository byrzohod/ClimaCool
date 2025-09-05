using AutoMapper;
using ClimaCool.Application.DTOs.Cart;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Mappings
{
    public class CartMappingProfile : Profile
    {
        public CartMappingProfile()
        {
            CreateMap<Cart, CartDto>()
                .ForMember(dest => dest.SubTotal, opt => opt.MapFrom(src => src.SubTotal))
                .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.ItemCount));
                
            CreateMap<CartItem, CartItemDto>()
                .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.Total))
                .ForMember(dest => dest.ProductName, opt => opt.Ignore())
                .ForMember(dest => dest.ProductSlug, opt => opt.Ignore())
                .ForMember(dest => dest.ProductImageUrl, opt => opt.Ignore())
                .ForMember(dest => dest.VariantName, opt => opt.Ignore())
                .ForMember(dest => dest.AvailableStock, opt => opt.Ignore());
        }
    }
}