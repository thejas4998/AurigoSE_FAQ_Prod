using Microsoft.EntityFrameworkCore;
using FAQApp.API.Models;

namespace FAQApp.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<QuestionImage> QuestionImages { get; set; }
        public DbSet<AnswerImage> AnswerImages { get; set; }
        
        // ✅ Add this line
        public DbSet<AnswerVote> AnswerVotes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relationship: Question → Answers
            modelBuilder.Entity<Question>()
                .HasMany(q => q.Answers)
                .WithOne(a => a.Question)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: Question → QuestionImages
            modelBuilder.Entity<QuestionImage>()
                .HasOne(qi => qi.Question)
                .WithMany(q => q.Images)
                .HasForeignKey(qi => qi.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: Answer → AnswerImages
            modelBuilder.Entity<AnswerImage>()
                .HasOne(ai => ai.Answer)
                .WithMany(a => a.Images)
                .HasForeignKey(ai => ai.AnswerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ New: Relationship: Answer → AnswerVotes
            modelBuilder.Entity<AnswerVote>()
                .HasOne(av => av.Answer)
                .WithMany(a => a.Votes)
                .HasForeignKey(av => av.AnswerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ New: Ensure one vote per user per answer
            modelBuilder.Entity<AnswerVote>()
                .HasIndex(av => new { av.AnswerId, av.UserId })
                .IsUnique();
        }
    }
}