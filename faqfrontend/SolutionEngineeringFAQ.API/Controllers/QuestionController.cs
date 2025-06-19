using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FAQApp.API.Data;
using FAQApp.API.Models;
using SolutionEngineeringFAQ.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace FAQApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QuestionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<QuestionsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public QuestionsController(AppDbContext context, ILogger<QuestionsController> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
        }

        // POST: api/questions
        [HttpPost]
        public async Task<ActionResult<QuestionDto>> PostQuestion(Question question)
        {
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            var dto = MapToDto(question);
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
            return questions.Select(MapToDto).ToList();
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

            return MapToDto(question);
        }

        // Map method - updated with null-check and FirstOrDefault protection
        private QuestionDto MapToDto(Question question)
        {
            if (question == null)
                throw new ArgumentNullException(nameof(question));

            var userId = User.FindFirst(ClaimTypes.Email)?.Value 
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return new QuestionDto
            {
                Id = question.Id,
                Title = question.Title,
                Body = question.Body,
                Category = question.Category,
                CreatedAt = question.CreatedAt,
                Answered = question.Answered,
                ImageUrls = question.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
                Answers = question.Answers?.Select(a =>
                {
                    var userVote = a.Votes?.FirstOrDefault(v => v.UserId == userId);
                    return new AnswerDto
                    {
                        Id = a.Id,
                        Body = a.Body,
                        CreatedAt = a.CreatedAt,
                        QuestionId = a.QuestionId,
                        ImageUrls = a.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
                        UpvoteCount = a.Votes?.Count(v => v.IsUpvote) ?? 0,
                        DownvoteCount = a.Votes?.Count(v => !v.IsUpvote) ?? 0,
                        UserVote = userVote == null ? null : (userVote.IsUpvote ? "upvote" : "downvote")
                    };
                }).ToList() ?? new List<AnswerDto>()
            };
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
                // Step 1: Find relevant questions using keyword search
                var relevantQuestions = await FindRelevantQuestions(query.Message);
                
                // Step 2: If no questions found, return a helpful message
                if (!relevantQuestions.Any())
                {
                    return Ok(new ChatbotResponseDto
                    {
                        Response = "I couldn't find any questions related to your query. Please try rephrasing or browse through our categories.",
                        RelatedQuestions = new List<RelatedQuestionDto>()
                    });
                }

                // Step 3: Prepare context for LLM
                var context = PrepareContextForLLM(relevantQuestions, query.Message);
                
                // Step 4: Call LLM API (OpenAI example - replace with your LLM)
                var llmResponse = await CallLLM(context);
                
                // Step 5: Return response with related questions
                return Ok(new ChatbotResponseDto
                {
                    Response = llmResponse,
                    RelatedQuestions = relevantQuestions.Take(3).Select(q => new RelatedQuestionDto
                    {
                        Id = q.Id,
                        Title = q.Title,
                        Body = q.Body,
                        Category = q.Category,
                        AnswerBodies = q.Answers?.Select(a => a.Body).ToList() ?? new List<string>()
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot query");
                return Ok(new ChatbotResponseDto
                {
                    Response = "I'm having trouble processing your request right now. Please try again later.",
                    RelatedQuestions = new List<RelatedQuestionDto>()
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
                .Take(20) // Limit results
                .ToListAsync();

            return questions.Select(MapToDto).ToList();
        }
        private async Task<List<Question>> FindRelevantQuestions(string userQuery)
        {
            // Convert query to lowercase for case-insensitive search
            var lowerQuery = userQuery.ToLower();
            var keywords = lowerQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                                    .Where(w => w.Length > 2); // Filter out small words

            // Find questions that contain any of the keywords
            var questions = await _context.Questions
                .Include(q => q.Answers)
                .Where(q =>
                    keywords.Any(keyword =>
                        q.Title.ToLower().Contains(keyword) ||
                        (q.Body != null && q.Body.ToLower().Contains(keyword)) ||
                        q.Category.ToLower().Contains(keyword) ||
                        q.Answers!.Any(a => a.Body.ToLower().Contains(keyword))
                    )
                )
                .OrderByDescending(q => q.Answers!.Count) // Prioritize questions with more answers
                .Take(5) // Limit to top 5 relevant questions
                .ToListAsync();

            return questions;
        }

        private string PrepareContextForLLM(List<Question> questions, string userQuery)
        {
            var sb = new StringBuilder();
            sb.AppendLine("You are a helpful FAQ assistant. Answer the user's question based on the following Q&A data:");
            sb.AppendLine();
            
            foreach (var question in questions)
            {
                sb.AppendLine($"Question: {question.Title}");
                if (!string.IsNullOrEmpty(question.Body))
                    sb.AppendLine($"Details: {question.Body}");
                sb.AppendLine($"Category: {question.Category}");
                
                if (question.Answers?.Any() == true)
                {
                    sb.AppendLine("Answers:");
                    foreach (var answer in question.Answers.Take(3)) // Limit answers per question
                    {
                        sb.AppendLine($"- {answer.Body}");
                    }
                }
                sb.AppendLine();
            }
            
            sb.AppendLine($"User Question: {userQuery}");
            sb.AppendLine();
            sb.AppendLine("Please provide a helpful and concise answer based on the above information. If the exact answer isn't available, provide the most relevant information from the FAQ data.");
            
            return sb.ToString();
        }

        private async Task<string> CallLLM(string context)
        {
            // Get API configuration
            var apiKey = _configuration["OpenAI:ApiKey"]; // Store in user secrets or environment variables
            var apiUrl = _configuration["OpenAI:ApiUrl"] ?? "https://api.openai.com/v1/chat/completions";
            
            // If no API key configured, return a fallback response
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("LLM API key not configured. Using fallback response.");
                return GenerateFallbackResponse(context);
            }

            try
            {
                // Prepare the request for OpenAI API (adjust for your LLM)
                var requestBody = new
                {
                    model = "gpt-3.5-turbo",
                    messages = new[]
                    {
                        new { role = "system", content = "You are a helpful FAQ assistant." },
                        new { role = "user", content = context }
                    },
                    max_tokens = 500,
                    temperature = 0.7
                };

                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseContent);
                    var llmResponse = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();
                    
                    return llmResponse ?? "I couldn't generate a response.";
                }
                else
                {
                    _logger.LogError($"LLM API call failed with status: {response.StatusCode}");
                    return GenerateFallbackResponse(context);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling LLM API");
                return GenerateFallbackResponse(context);
            }
        }

        private string GenerateFallbackResponse(string context)
        {
            // Simple fallback logic when LLM is not available
            var lines = context.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var relevantInfo = new List<string>();
            
            foreach (var line in lines)
            {
                if (line.StartsWith("Question:") || line.StartsWith("- "))
                {
                    relevantInfo.Add(line);
                }
            }
            
            if (relevantInfo.Any())
            {
                return $"Based on our FAQ database, here's what I found:\n\n{string.Join("\n", relevantInfo.Take(5))}\n\nFor more detailed information, please check the specific questions in the FAQ section.";
            }
            
            return "I couldn't find specific information about your query. Please try browsing our FAQ categories or asking a more specific question.";
        }
    }
}