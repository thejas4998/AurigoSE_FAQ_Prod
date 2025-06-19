using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FAQApp.API.Data;
using FAQApp.API.Models;
using SolutionEngineeringFAQ.API.DTOs;
using System.Security.Claims;

namespace FAQApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class VotesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<VotesController> _logger;

        public VotesController(AppDbContext context, ILogger<VotesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/votes/answer/5
        [HttpPost("answer/{answerId}")]
        public async Task<IActionResult> VoteOnAnswer(int answerId, [FromBody] VoteDto voteDto)
        {
            // Get current user from JWT claims
            var userId = User.FindFirst(ClaimTypes.Email)?.Value 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            // Check if answer exists
            var answer = await _context.Answers.FindAsync(answerId);
            if (answer == null)
                return NotFound("Answer not found");

            // Check if user has already voted
            var existingVote = await _context.AnswerVotes
                .FirstOrDefaultAsync(v => v.AnswerId == answerId && v.UserId == userId);

            if (existingVote != null)
            {
                // User has already voted
                if (existingVote.IsUpvote == voteDto.IsUpvote)
                {
                    // Same vote - remove it (toggle off)
                    _context.AnswerVotes.Remove(existingVote);
                    _logger.LogInformation($"User {userId} removed their vote on answer {answerId}");
                }
                else
                {
                    // Different vote - update it
                    existingVote.IsUpvote = voteDto.IsUpvote;
                    existingVote.CreatedAt = DateTime.UtcNow;
                    _logger.LogInformation($"User {userId} changed their vote on answer {answerId}");
                }
            }
            else
            {
                // New vote
                var newVote = new AnswerVote
                {
                    UserId = userId,
                    AnswerId = answerId,
                    IsUpvote = voteDto.IsUpvote
                };
                _context.AnswerVotes.Add(newVote);
                _logger.LogInformation($"User {userId} voted on answer {answerId}");
            }

            await _context.SaveChangesAsync();

            // Return updated vote counts
            var upvotes = await _context.AnswerVotes
                .CountAsync(v => v.AnswerId == answerId && v.IsUpvote);
            var downvotes = await _context.AnswerVotes
                .CountAsync(v => v.AnswerId == answerId && !v.IsUpvote);

            return Ok(new { upvotes, downvotes });
        }

        // GET: api/votes/answer/5
        [HttpGet("answer/{answerId}")]
        public async Task<IActionResult> GetAnswerVotes(int answerId)
        {
            var userId = User.FindFirst(ClaimTypes.Email)?.Value 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var upvotes = await _context.AnswerVotes
                .CountAsync(v => v.AnswerId == answerId && v.IsUpvote);
            var downvotes = await _context.AnswerVotes
                .CountAsync(v => v.AnswerId == answerId && !v.IsUpvote);
            
            string? userVote = null;
            if (!string.IsNullOrEmpty(userId))
            {
                var vote = await _context.AnswerVotes
                    .FirstOrDefaultAsync(v => v.AnswerId == answerId && v.UserId == userId);
                if (vote != null)
                    userVote = vote.IsUpvote ? "upvote" : "downvote";
            }

            return Ok(new { upvotes, downvotes, userVote });
        }
    }
}