using System;

namespace Api.Models;

public class EmailLog
{
    public int Id { get; set; }
    public Guid SubmissionId { get; set; }
    public string To { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string? AttachmentUrl { get; set; }
}
