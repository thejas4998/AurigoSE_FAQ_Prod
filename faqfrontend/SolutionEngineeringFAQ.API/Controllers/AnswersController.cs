using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FAQApp.API.Data;
using FAQApp.API.Models;
using SolutionEngineeringFAQ.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FAQApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnswersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnswersController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/answers
        [HttpPost]
        public async Task<ActionResult<AnswerDto>> PostAnswer(Answer answer)
        {
            // Ensure the question exists
            var question = await _context.Questions.FindAsync(answer.QuestionId);
            if (question == null)
                return BadRequest("Invalid QuestionId");

            _context.Answers.Add(answer);
            question.Answered = true;
            await _context.SaveChangesAsync();

            var dto = new AnswerDto
            {
                Id = answer.Id,
                Body = answer.Body,
                CreatedAt = answer.CreatedAt,
                QuestionId = answer.QuestionId,
                ImageUrls = new List<string>(),
                UpvoteCount = 0,
                DownvoteCount = 0,
                UserVote = null
            };

            return CreatedAtAction(nameof(GetAnswer), new { id = dto.Id }, dto);
        }

        // GET: api/answers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AnswerDto>> GetAnswer(int id)
        {
            var answer = await _context.Answers
                .Include(a => a.Images)
                .Include(a => a.Votes)
                .FirstOrDefaultAsync(a => a.Id == id);
                
            if (answer == null)
                return NotFound();

            var userId = User.FindFirst(ClaimTypes.Email)?.Value 
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var dto = MapToDto(answer, userId);
            return dto;
        }

        // Helper method to map Answer to AnswerDto with vote information
        private AnswerDto MapToDto(Answer answer, string? userId)
        {
            var userVote = answer.Votes?.FirstOrDefault(v => v.UserId == userId);
            
            return new AnswerDto
            {
                Id = answer.Id,
                Body = answer.Body,
                CreatedAt = answer.CreatedAt,
                QuestionId = answer.QuestionId,
                ImageUrls = answer.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
                UpvoteCount = answer.Votes?.Count(v => v.IsUpvote) ?? 0,
                DownvoteCount = answer.Votes?.Count(v => !v.IsUpvote) ?? 0,
                UserVote = userVote == null ? null : (userVote.IsUpvote ? "upvote" : "downvote")
            };
        }

        // DELETE: api/answers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnswer(int id)
        {
            var answer = await _context.Answers
                .Include(a => a.Images)
                .Include(a => a.Votes) // Include votes for cascade delete
                .FirstOrDefaultAsync(a => a.Id == id);
                
            if (answer == null)
                return NotFound();

            _context.Answers.Remove(answer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/answers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAnswer(int id, Answer updatedAnswer)
        {
            if (id != updatedAnswer.Id)
                return BadRequest("ID mismatch");

            var answer = await _context.Answers.FindAsync(id);
            if (answer == null)
                return NotFound();

            answer.Body = updatedAnswer.Body;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}