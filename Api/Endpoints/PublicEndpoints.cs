using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PublicEndpoints
{
    public static IEndpointRouteBuilder MapPublic(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/public");

        // POST /api/public/submissions  multipart/form-data
        group.MapPost("/submissions", async (
            [FromServices] AppDb db,
            [FromServices] IStorage storage,
            HttpRequest req) =>
        {
            if (!req.HasFormContentType) return Results.BadRequest("Use multipart/form-data.");
            var form = await req.ReadFormAsync();
            var name = form["name"].ToString();
            var email = form["email"].ToString();
            var file = form.Files.GetFile("photo");

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || file is null)
                return Results.BadRequest("Missing fields.");

            // enforce per-email submission cap
            var existingCount = await db.Submissions.CountAsync(s => s.Email == email);
            if (existingCount >= 2)
                return Results.BadRequest("You already submitted 2 requests with this email.");

            // basic file guard
            if (file.Length == 0 || file.Length > 10 * 1024 * 1024) // 10 MB
                return Results.BadRequest("Invalid file size.");

            var url = await storage.SaveAsync(file.OpenReadStream(), file.FileName, file.ContentType);

            var sub = new Submission
            {
                Name = name,
                Email = email,
                OriginalImageUrl = url
            };

            db.Submissions.Add(sub);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = sub.Id });
        });

        return app;
    }
}
