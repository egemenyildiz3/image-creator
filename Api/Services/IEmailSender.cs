namespace Api.Services;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody, Stream? attachment = null, string? attachmentName = null);
}
