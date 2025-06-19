using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SolutionEngineeringFAQ.API.DTOs
{
    public class AnswerDto
    {
        public int Id { get; set; }
        public required string Body { get; set; }
        public DateTime CreatedAt { get; set; }
        public int QuestionId { get; set; }
        
        // Include image URLs
        public List<string> ImageUrls { get; set; } = new List<string>();
        
        // ✅ New: Vote information
        public int UpvoteCount { get; set; }
        public int DownvoteCount { get; set; }
        public string? UserVote { get; set; } // "upvote", "downvote", or null
    }

    // DTO for voting request
    public class VoteDto
    {
        public bool IsUpvote { get; set; }
    }
}