using System;
using System.ComponentModel.DataAnnotations;

namespace FAQApp.API.Models
{
    public class Question
    {
        public int Id { get; set; }

        [Required]
        public required string Title { get; set; }

        public string? Body { get; set; }

        [Required]
        public required string Category { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool Answered { get; set; } = false;

        public ICollection<Answer>? Answers { get; set; }

        public ICollection<QuestionImage>? Images { get; set; } = new List<QuestionImage>();
    }
    
    public class QuestionImage
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;
    }
}