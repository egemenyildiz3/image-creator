using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) {}

    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Helpful index for the email limit check
        modelBuilder.Entity<Submission>()
            .HasIndex(s => s.Email);
    }
}
