using AutoMapper;
using ClimaCool.Application.DTOs.Checkout;
using ClimaCool.Domain.Entities;

namespace ClimaCool.Application.Mappings;

public class CheckoutMappingProfile : Profile
{
    public CheckoutMappingProfile()
    {
        // Address mappings
        CreateMap<Address, AddressDto>().ReverseMap();
        
        // Order mappings
        CreateMap<Order, OrderDto>()
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items))
            .ForMember(dest => dest.ShippingAddress, opt => opt.MapFrom(src => src.ShippingAddress))
            .ForMember(dest => dest.BillingAddress, opt => opt.MapFrom(src => src.BillingAddress));
            
        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.Total));
    }
}