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

        public ICollection<AnswerImage>? Images { get; set; } = [];

        public ICollection<AnswerVote>? Votes { get; set; } = [];
    }

}