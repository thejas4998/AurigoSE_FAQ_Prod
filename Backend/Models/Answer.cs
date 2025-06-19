using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FAQApp.API.Models
{
    public class Answer
    {
        public int Id { get; set; }

        [Required]
        public required string Body { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("Question")]
        public int QuestionId { get; set; }

        public Question? Question { get; set; }

        // Collection of attached images
        public ICollection<AnswerImage>? Images { get; set; } = new List<AnswerImage>();

        // ✅ New: Collection of votes
        public ICollection<AnswerVote>? Votes { get; set; } = new List<AnswerVote>();
    }

    public class AnswerImage
    {
        public int Id { get; set; }

        public string ImageUrl { get; set; } = null!;

        [ForeignKey("Answer")]
        public int AnswerId { get; set; }

        public Answer Answer { get; set; } = null!;
    }
}