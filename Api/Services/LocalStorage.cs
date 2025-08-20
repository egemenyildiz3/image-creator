using Microsoft.AspNetCore.StaticFiles;

namespace Api.Services;
public class LocalStorage : IStorage
{
    private readonly IWebHostEnvironment _env;
    private readonly FileExtensionContentTypeProvider _types = new();

    public LocalStorage(IWebHostEnvironment env) => _env = env;

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType)
    {
        var uploads = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploads);
        var id = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(fileName);
        var safeName = $"{id}{ext}";
        var path = Path.Combine(uploads, safeName);
        using var fs = File.Create(path);
        await stream.CopyToAsync(fs);
        return $"/uploads/{safeName}";
    }
}
