using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdmin(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin");

        // --- UNPROTECTED: LOGIN ---
        admin.MapPost("/login", async (
            AppDb db,
            ITokenService tokens,
            [FromBody] LoginDto dto) =>
        {
            var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (user is null) return Results.Unauthorized();

            var hash = Hash(dto.Password);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(hash),
                    Encoding.UTF8.GetBytes(user.PasswordHash)))
            {
                return Results.Unauthorized();
            }

            var jwt = tokens.CreateToken(user.Username);
            return Results.Ok(new { token = jwt });
        });

        // --- PROTECTED GROUP: everything below requires role=admin ---
        var authed = admin.MapGroup("")
            .RequireAuthorization(policy => policy.RequireRole("admin"));

        // GET /api/admin/submissions
        authed.MapGet("/submissions", async (AppDb db, int page = 1, int pageSize = 20) =>
        {
            var q = db.Submissions.OrderByDescending(s => s.CreatedAt);
            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return Results.Ok(new { total, items });
        });

        // POST /api/admin/submissions/{id}/email
        authed.MapPost("/submissions/{id:guid}/email", async (
            Guid id,
            AppDb db,
            IEmailSender email,
            IStorage storage,
            HttpRequest req) =>
        {
            var sub = await db.Submissions.FindAsync(id);
            if (sub is null) return Results.NotFound();

            if (!req.HasFormContentType) return Results.BadRequest("Use multipart/form-data.");
            var form = await req.ReadFormAsync();
            var subject = form["subject"].ToString();
            var body = form["body"].ToString();
            var attach = form.Files.GetFile("attachment");

            Stream? attachStream = null;
            string? attachName = null;
            string? storedAttachUrl = null;

            if (attach != null && attach.Length > 0)
            {
                attachStream = attach.OpenReadStream();
                attachName = attach.FileName;

                // optional: store attachment for audit
                storedAttachUrl = await storage.SaveAsync(attach.OpenReadStream(), attach.FileName, attach.ContentType);
            }

            await email.SendAsync(sub.Email, subject, body, attachStream, attachName);

            db.EmailLogs.Add(new EmailLog
            {
                SubmissionId = sub.Id,
                To = sub.Email,
                Subject = subject,
                AttachmentUrl = storedAttachUrl
            });
            sub.Status = "emailed";
            await db.SaveChangesAsync();

            return Results.Ok();
        });

        return app;
    }

    private static string Hash(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    public record LoginDto(string Username, string Password);
}
