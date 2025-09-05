using AutoMapper;
using ClimaCool.Application.DTOs.Category;
using ClimaCool.Domain.Entities;
using System.Linq;

namespace ClimaCool.Application.Mappings
{
    public class CategoryMappingProfile : Profile
    {
        public CategoryMappingProfile()
        {
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.ParentCategoryName, opt => opt.MapFrom(src => 
                    src.ParentCategory != null ? src.ParentCategory.Name : null))
                .ForMember(dest => dest.ChildCategories, opt => opt.MapFrom(src => src.ChildCategories))
                .ForMember(dest => dest.ProductCount, opt => opt.Ignore()); // Will be set in service

            CreateMap<Category, CategoryListDto>()
                .ForMember(dest => dest.ProductCount, opt => opt.Ignore()) // Will be set in service
                .ForMember(dest => dest.HasChildren, opt => opt.MapFrom(src => src.ChildCategories.Any()));

            CreateMap<CreateCategoryDto, Category>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.ParentCategory, opt => opt.Ignore())
                .ForMember(dest => dest.ChildCategories, opt => opt.Ignore())
                .ForMember(dest => dest.Products, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<UpdateCategoryDto, Category>()
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.ParentCategory, opt => opt.Ignore())
                .ForMember(dest => dest.ChildCategories, opt => opt.Ignore())
                .ForMember(dest => dest.Products, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
        }
    }
}