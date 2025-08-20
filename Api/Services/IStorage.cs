namespace Api.Services;
public interface IStorage
{
    Task<string> SaveAsync(Stream stream, string fileName, string contentType);
}
