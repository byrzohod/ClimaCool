using AutoMapper;
using ClimaCool.Application.DTOs.Search;

namespace ClimaCool.Application.Mappings
{
    public class SearchMappingProfile : Profile
    {
        public SearchMappingProfile()
        {
            CreateMap<ProductDocument, SearchProductDto>()
                .ForMember(dest => dest.Score, opt => opt.Ignore())
                .ForMember(dest => dest.Highlights, opt => opt.Ignore());
        }
    }
}