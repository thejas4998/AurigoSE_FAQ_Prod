using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FAQApp.API.Data;
using FAQApp.API.Models;
using SolutionEngineeringFAQ.API.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace FAQApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [TypeFilter(typeof(FAQApp.API.Filters.GlobalExceptionFilter))]
public class QuestionsController(AppDbContext context, ILogger<QuestionsController> logger, Services.ChatbotService chatbotService, Services.QuestionSearchService questionSearchService, AutoMapper.IMapper mapper) : ControllerBase
    {
    private readonly AppDbContext _context = context;
    private readonly ILogger<QuestionsController> _logger = logger;
    private readonly Services.ChatbotService _chatbotService = chatbotService;
    private readonly Services.QuestionSearchService _questionSearchService = questionSearchService;
    private readonly AutoMapper.IMapper _mapper = mapper;

        // POST: api/questions
        [HttpPost]
        public async Task<ActionResult<QuestionDto>> PostQuestion(Question question)
        {
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<QuestionDto>(question);
            return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, dto);
        }

        // GET: api/questions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionDto>>> GetQuestions([FromQuery] string? category)
        {
            var query = _context.Questions
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Images!)
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Votes!)
                .Include(q => q.Images!)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(q => q.Category == category);

            var questions = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
            var dtos = _mapper.Map<List<QuestionDto>>(questions);
            return dtos;
        }

        // GET: api/questions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionDto>> GetQuestion(int id)
        {
            var question = await _context.Questions
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Images!)
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Votes)
                .Include(q => q.Images)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (question == null) return NotFound();

            var dto = _mapper.Map<QuestionDto>(question);
            return dto;
        }


        // PUT: api/questions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, Question updatedQuestion)
        {
            if (id != updatedQuestion.Id)
                return BadRequest("ID mismatch");

            var question = await _context.Questions.FindAsync(id);
            if (question == null)
                return NotFound();

            question.Title = updatedQuestion.Title;
            question.Body = updatedQuestion.Body;
            question.Category = updatedQuestion.Category;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/questions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.Questions
                .Include(q => q.Answers)
                .Include(q => q.Images)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (question == null)
                return NotFound();

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/questions/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Questions
                                        .Select(q => q.Category)
                                        .Distinct()
                                        .ToListAsync();
            return categories;
        }

        // Optional debug endpoint to inspect claims
        [HttpGet("debug-user")]
        public IActionResult DebugUser()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value });
            return Ok(claims);
        }

        // POST: api/questions/chatbot
        [HttpPost("chatbot")]
        public async Task<ActionResult<ChatbotResponseDto>> ChatbotQuery([FromBody] ChatbotQueryDto query)
        {
            try
            {
                var relevantQuestions = await _questionSearchService.FindRelevantQuestions(query.Message);
                if (relevantQuestions.Count == 0)
                {
                    return Ok(new ChatbotResponseDto
                    {
                        Response = "I couldn't find any questions related to your query. Please try rephrasing or browse through our categories.",
                        RelatedQuestions = []
                    });
                }

                var context = Services.ChatbotService.PrepareContextForLLM(relevantQuestions, query.Message);
                var llmResponse = await _chatbotService.CallLLM(context);

                return Ok(new ChatbotResponseDto
                {
                    Response = llmResponse,
                    RelatedQuestions = [.. relevantQuestions.Take(3).Select(q => new RelatedQuestionDto
                    {
                        Id = q.Id,
                        Title = q.Title,
                        Body = q.Body,
                        Category = q.Category,
                        AnswerBodies = q.Answers?.Select(a => a.Body).ToList() ?? []
                    })]
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot query");
                return Ok(new ChatbotResponseDto
                {
                    Response = "I'm having trouble processing your request right now. Please try again later.",
                    RelatedQuestions = []
                });
            }
        }



        // GET: api/questions/search?q=searchterm
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<QuestionDto>>> SearchQuestions([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query cannot be empty");
            }

            var searchTerm = q.ToLower().Trim();
            
            var questions = await _context.Questions
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Images!)
                .Include(q => q.Answers!)
                    .ThenInclude(a => a.Votes!)
                .Include(q => q.Images!)
                .Where(question => 
                    // Search in question title
                    question.Title.ToLower().Contains(searchTerm) ||
                    // Search in question body
                    (question.Body != null && question.Body.ToLower().Contains(searchTerm)) ||
                    // Search in category
                    question.Category.ToLower().Contains(searchTerm) ||
                    // Search in answers
                    question.Answers!.Any(a => a.Body.ToLower().Contains(searchTerm))
                )
                .OrderByDescending(q => 
                    // Prioritize title matches
                    q.Title.ToLower().Contains(searchTerm) ? 3 :
                    // Then category matches
                    q.Category.ToLower().Contains(searchTerm) ? 2 :
                    // Then body/answer matches
                    1
                )
                .ThenByDescending(q => q.CreatedAt)
                .Take(Constants.MaxSearchResults) // Limit results
                .ToListAsync();

            var dtos = _mapper.Map<List<QuestionDto>>(questions);
            return dtos;
        }

    }
}