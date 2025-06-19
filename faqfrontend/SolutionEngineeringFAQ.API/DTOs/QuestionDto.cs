using System;
using System.Collections.Generic;

namespace SolutionEngineeringFAQ.API.DTOs
{
    public class QuestionDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Body { get; set; }  // Allow Body to be nullable if your entity allows
        public required string Category { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool Answered { get; set; }
        public required List<AnswerDto> Answers { get; set; }
        
        // Add this property to include image URLs
        public List<string> ImageUrls { get; set; } = new List<string>();
    }
}