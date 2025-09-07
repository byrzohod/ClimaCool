using Microsoft.AspNetCore.Http;

namespace ClimaCool.Application.Interfaces;

public interface IImageUploadService
{
    Task<string> UploadImageAsync(IFormFile file, string folder);
    Task<bool> DeleteImageAsync(string imageUrl);
    Task<List<string>> UploadMultipleImagesAsync(List<IFormFile> files, string folder);
    bool IsValidImageFile(IFormFile file);
    string GenerateThumbnailUrl(string imageUrl, int width, int height);
}