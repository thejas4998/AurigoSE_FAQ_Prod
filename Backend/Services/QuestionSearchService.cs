using FAQApp.API.Data;
using FAQApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FAQApp.API.Services
{
    public class QuestionSearchService
    {
        private readonly AppDbContext _context;
        public QuestionSearchService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Question>> FindRelevantQuestions(string userQuery)
        {
            var lowerQuery = userQuery.ToLower();
            var keywords = lowerQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                                     .Where(w => w.Length > 2);

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
                .OrderByDescending(q => q.Answers!.Count)
                .Take(Constants.MaxRelatedQuestions)
                .ToListAsync();

            return questions;
        }
    }
}
