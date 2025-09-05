using AutoMapper;
using ClimaCool.Application.DTOs.Product;
using ClimaCool.Domain.Entities;
using System.Linq;

namespace ClimaCool.Application.Mappings
{
    public class ProductMappingProfile : Profile
    {
        public ProductMappingProfile()
        {
            // Product mappings
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
                .ForMember(dest => dest.PrimaryImageUrl, opt => opt.MapFrom(src => 
                    src.Images.FirstOrDefault(i => i.IsPrimary) != null 
                        ? src.Images.FirstOrDefault(i => i.IsPrimary)!.ImageUrl 
                        : null))
                .ForMember(dest => dest.InStock, opt => opt.MapFrom(src => src.StockQuantity > 0))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images.OrderBy(i => i.DisplayOrder)))
                .ForMember(dest => dest.Attributes, opt => opt.MapFrom(src => src.Attributes.OrderBy(a => a.DisplayOrder)));

            CreateMap<Product, ProductListDto>()
                .ForMember(dest => dest.PrimaryImageUrl, opt => opt.MapFrom(src => 
                    src.Images.FirstOrDefault(i => i.IsPrimary) != null 
                        ? src.Images.FirstOrDefault(i => i.IsPrimary)!.ImageUrl 
                        : null))
                .ForMember(dest => dest.InStock, opt => opt.MapFrom(src => src.StockQuantity > 0));

            CreateMap<CreateProductDto, Product>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.Variants, opt => opt.Ignore())
                .ForMember(dest => dest.Attributes, opt => opt.Ignore())
                .ForMember(dest => dest.Reviews, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.PublishedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateProductDto, Product>()
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.Variants, opt => opt.Ignore())
                .ForMember(dest => dest.Attributes, opt => opt.Ignore())
                .ForMember(dest => dest.Reviews, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore());

            // Product Image mappings
            CreateMap<ProductImage, ProductImageDto>();

            // Product Variant mappings
            CreateMap<ProductVariant, ProductVariantDto>()
                .ForMember(dest => dest.Attributes, opt => opt.MapFrom(src => src.Attributes));
            
            CreateMap<ProductVariantDto, ProductVariant>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ProductId, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            // Product Attribute mappings
            CreateMap<ProductAttribute, ProductAttributeDto>();
            CreateMap<ProductVariantAttribute, ProductVariantAttributeDto>();
        }
    }
}