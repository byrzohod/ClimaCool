using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ClimaCool.Application.DTOs.Category;
using ClimaCool.Domain.Entities;
using ClimaCool.Domain.Interfaces;
using ClimaCool.Application.Extensions;
using Microsoft.Extensions.Logging;

namespace ClimaCool.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(
            IUnitOfWork unitOfWork,
            ICategoryRepository categoryRepository,
            IMapper mapper,
            ILogger<CategoryService> logger)
        {
            _unitOfWork = unitOfWork;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.GetActiveAsync();
            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(categories);

            // Get product counts for each category
            foreach (var dto in dtos)
            {
                dto.ProductCount = await _categoryRepository.GetProductCountAsync(dto.Id);
            }

            return dtos;
        }

        public async Task<IEnumerable<CategoryHierarchyDto>> GetCategoryHierarchyAsync()
        {
            var categories = await _categoryRepository.GetHierarchyAsync();
            return BuildHierarchy(categories, null);
        }

        private List<CategoryHierarchyDto> BuildHierarchy(IEnumerable<Category> categories, int? parentId, int level = 0)
        {
            var result = new List<CategoryHierarchyDto>();
            var children = categories.Where(c => c.ParentCategoryId == parentId);

            foreach (var category in children)
            {
                var dto = new CategoryHierarchyDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Level = level,
                    Children = BuildHierarchy(categories, category.Id, level + 1)
                };
                result.Add(dto);
            }

            return result;
        }

        public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetWithChildrenAsync(id);
            if (category == null) return null;

            var dto = _mapper.Map<CategoryDto>(category);
            dto.ProductCount = await _categoryRepository.GetProductCountAsync(id);
            
            // Map child categories
            if (category.ChildCategories.Any())
            {
                dto.ChildCategories = _mapper.Map<List<CategoryDto>>(category.ChildCategories);
                foreach (var child in dto.ChildCategories)
                {
                    child.ProductCount = await _categoryRepository.GetProductCountAsync(child.Id);
                }
            }

            return dto;
        }

        public async Task<CategoryDto?> GetCategoryBySlugAsync(string slug)
        {
            var category = await _categoryRepository.GetBySlugAsync(slug);
            if (category == null) return null;

            var dto = _mapper.Map<CategoryDto>(category);
            dto.ProductCount = await _categoryRepository.GetProductCountAsync(category.Id);

            return dto;
        }

        public async Task<IEnumerable<CategoryListDto>> GetRootCategoriesAsync()
        {
            var categories = await _categoryRepository.GetRootCategoriesAsync();
            var dtos = _mapper.Map<IEnumerable<CategoryListDto>>(categories);

            foreach (var dto in dtos)
            {
                dto.ProductCount = await _categoryRepository.GetProductCountAsync(dto.Id);
                dto.HasChildren = categories.Any(c => c.ChildCategories.Any());
            }

            return dtos;
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
        {
            var category = _mapper.Map<Category>(dto);
            
            // Generate slug from name
            category.Slug = dto.Name.ToSlug();
            int counter = 1;
            while (!await _categoryRepository.IsSlugUniqueAsync(category.Slug))
            {
                category.Slug = $"{dto.Name.ToSlug()}-{counter++}";
            }

            category.CreatedAt = DateTime.UtcNow;
            
            await _categoryRepository.AddAsync(category);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Category created with ID {CategoryId}", category.Id);

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> UpdateCategoryAsync(UpdateCategoryDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(dto.Id);
            if (category == null)
            {
                throw new ApplicationException($"Category with ID {dto.Id} not found.");
            }

            // Check if we're not creating a circular reference
            if (dto.ParentCategoryId.HasValue && dto.ParentCategoryId == dto.Id)
            {
                throw new ApplicationException("A category cannot be its own parent.");
            }

            _mapper.Map(dto, category);
            
            // Update slug if name changed
            if (category.Name != dto.Name)
            {
                category.Slug = dto.Name.ToSlug();
                int counter = 1;
                while (!await _categoryRepository.IsSlugUniqueAsync(category.Slug, dto.Id))
                {
                    category.Slug = $"{dto.Name.ToSlug()}-{counter++}";
                }
            }

            category.UpdatedAt = DateTime.UtcNow;
            
            _categoryRepository.Update(category);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Category {CategoryId} updated", category.Id);

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            // Check if category can be deleted
            if (!await _categoryRepository.CanDeleteAsync(id))
            {
                throw new ApplicationException("Cannot delete category with products or child categories.");
            }

            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null) return false;

            await _categoryRepository.DeleteAsync(id);
            await _unitOfWork.CompleteAsync();
            
            _logger.LogInformation("Category {CategoryId} deleted", id);
            
            return true;
        }

        public async Task<bool> UpdateDisplayOrderAsync(int categoryId, int displayOrder)
        {
            await _categoryRepository.UpdateDisplayOrderAsync(categoryId, displayOrder);
            await _unitOfWork.CompleteAsync();
            
            _logger.LogInformation("Display order updated for category {CategoryId}: {DisplayOrder}", categoryId, displayOrder);
            
            return true;
        }

        public async Task<int> GetProductCountAsync(int categoryId)
        {
            return await _categoryRepository.GetProductCountAsync(categoryId);
        }
    }
}