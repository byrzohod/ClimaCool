using ClimaCool.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace ClimaCool.Infrastructure.Services;

public class LocalImageUploadService : IImageUploadService
{
    private readonly string _uploadPath;
    private readonly string _baseUrl;
    private readonly ILogger<LocalImageUploadService> _logger;
    private readonly HashSet<string> _allowedExtensions = new() { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB

    public LocalImageUploadService(IConfiguration configuration, ILogger<LocalImageUploadService> logger)
    {
        _uploadPath = configuration["Storage:LocalPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        _baseUrl = configuration["Storage:BaseUrl"] ?? "/uploads";
        _logger = logger;

        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        if (!IsValidImageFile(file))
        {
            throw new ArgumentException("Invalid image file");
        }

        var folderPath = Path.Combine(_uploadPath, folder);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        var filePath = Path.Combine(folderPath, fileName);

        try
        {
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Generate thumbnails
            await GenerateThumbnailsAsync(filePath, folderPath, fileName);

            var relativePath = Path.Combine(folder, fileName).Replace('\\', '/');
            return $"{_baseUrl}/{relativePath}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image to {FilePath}", filePath);
            
            // Clean up if upload failed
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            
            throw;
        }
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        try
        {
            var relativePath = imageUrl.Replace(_baseUrl, "").TrimStart('/');
            var filePath = Path.Combine(_uploadPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);

                // Delete thumbnails
                var directory = Path.GetDirectoryName(filePath);
                var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(filePath);
                var extension = Path.GetExtension(filePath);

                var thumbnailSizes = new[] { "thumb", "small", "medium" };
                foreach (var size in thumbnailSizes)
                {
                    var thumbnailPath = Path.Combine(directory!, $"{fileNameWithoutExtension}_{size}{extension}");
                    if (File.Exists(thumbnailPath))
                    {
                        File.Delete(thumbnailPath);
                    }
                }

                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageUrl}", imageUrl);
            return false;
        }
    }

    public async Task<List<string>> UploadMultipleImagesAsync(List<IFormFile> files, string folder)
    {
        var uploadedUrls = new List<string>();

        foreach (var file in files)
        {
            try
            {
                var url = await UploadImageAsync(file, folder);
                uploadedUrls.Add(url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName}", file.FileName);
                
                // Rollback: delete already uploaded files
                foreach (var uploadedUrl in uploadedUrls)
                {
                    await DeleteImageAsync(uploadedUrl);
                }
                
                throw;
            }
        }

        return uploadedUrls;
    }

    public bool IsValidImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return false;
        }

        if (file.Length > _maxFileSize)
        {
            return false;
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
        {
            return false;
        }

        // Check file content (magic numbers)
        try
        {
            using var stream = file.OpenReadStream();
            var buffer = new byte[8];
            stream.Read(buffer, 0, buffer.Length);
            stream.Seek(0, SeekOrigin.Begin);

            // Check for common image file signatures
            if (buffer[0] == 0xFF && buffer[1] == 0xD8) return true; // JPEG
            if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47) return true; // PNG
            if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46) return true; // GIF
            if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46) return true; // WEBP

            return false;
        }
        catch
        {
            return false;
        }
    }

    public string GenerateThumbnailUrl(string imageUrl, int width, int height)
    {
        var directory = Path.GetDirectoryName(imageUrl) ?? "";
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(imageUrl);
        var extension = Path.GetExtension(imageUrl);

        return Path.Combine(directory, $"{fileNameWithoutExtension}_{width}x{height}{extension}").Replace('\\', '/');
    }

    private async Task GenerateThumbnailsAsync(string originalPath, string folderPath, string fileName)
    {
        try
        {
            var thumbnailSizes = new Dictionary<string, (int width, int height)>
            {
                { "thumb", (150, 150) },
                { "small", (300, 300) },
                { "medium", (600, 600) }
            };

            foreach (var size in thumbnailSizes)
            {
                var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
                var extension = Path.GetExtension(fileName);
                var thumbnailFileName = $"{fileNameWithoutExtension}_{size.Key}{extension}";
                var thumbnailPath = Path.Combine(folderPath, thumbnailFileName);

                await CreateThumbnailAsync(originalPath, thumbnailPath, size.Value.width, size.Value.height);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error generating thumbnails for {FilePath}", originalPath);
            // Don't throw - thumbnails are not critical
        }
    }

    private async Task CreateThumbnailAsync(string sourcePath, string destinationPath, int maxWidth, int maxHeight)
    {
        await Task.Run(() =>
        {
            using var image = Image.FromFile(sourcePath);
            
            var ratioX = (double)maxWidth / image.Width;
            var ratioY = (double)maxHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            var newWidth = (int)(image.Width * ratio);
            var newHeight = (int)(image.Height * ratio);

            using var thumbnail = new Bitmap(newWidth, newHeight);
            using var graphics = Graphics.FromImage(thumbnail);
            
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            
            graphics.DrawImage(image, 0, 0, newWidth, newHeight);

            // Save with appropriate quality
            var encoder = GetEncoder(ImageFormat.Jpeg);
            var encoderParameters = new EncoderParameters(1);
            encoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, 85L);

            thumbnail.Save(destinationPath, encoder, encoderParameters);
        });
    }

    private ImageCodecInfo GetEncoder(ImageFormat format)
    {
        var codecs = ImageCodecInfo.GetImageDecoders();
        foreach (var codec in codecs)
        {
            if (codec.FormatID == format.Guid)
            {
                return codec;
            }
        }
        return codecs.First();
    }
}