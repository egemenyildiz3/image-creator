using MailKit.Net.Smtp;
using MimeKit;

namespace Api.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _cfg;
    public SmtpEmailSender(IConfiguration cfg) => _cfg = cfg;

    public async Task SendAsync(string to, string subject, string htmlBody, Stream? attachment = null, string? attachmentName = null)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_cfg["Email:FromName"], _cfg["Email:From"]));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        if (attachment != null && attachmentName != null)
        {
            builder.Attachments.Add(attachmentName, ReadAllBytes(attachment));
        }
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_cfg["Email:Host"], int.Parse(_cfg["Email:Port"] ?? "587"), false);
        if (!string.IsNullOrWhiteSpace(_cfg["Email:User"]))
        {
            await client.AuthenticateAsync(_cfg["Email:User"], _cfg["Email:Pass"]);
        }
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static byte[] ReadAllBytes(Stream s)
    {
        using var ms = new MemoryStream();
        s.CopyTo(ms);
        return ms.ToArray();
    }
}
