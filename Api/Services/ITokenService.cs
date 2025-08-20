namespace Api.Services;

public interface ITokenService
{
    string CreateToken(string username);
}
