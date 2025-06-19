using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FAQApp.API.Models
{
    public class AnswerVote
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = null!; // User's email or ID from JWT

        [Required]
        public bool IsUpvote { get; set; } // true for upvote, false for downvote

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("Answer")]
        public int AnswerId { get; set; }

        public Answer Answer { get; set; } = null!;
    }
}