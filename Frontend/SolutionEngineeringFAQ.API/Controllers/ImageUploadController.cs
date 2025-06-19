using Microsoft.AspNetCore.Mvc;
using FAQApp.API.Data;
using FAQApp.API.Models;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Authorization;

namespace FAQApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ImageUploadController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ImageUploadController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("question")]
        public async Task<IActionResult> UploadQuestionImages([FromForm] int questionId, [FromForm] List<IFormFile> files)
        {
            var question = await _context.Questions.FindAsync(questionId);
            if (question == null) return NotFound("Question not found");

            var uploads = new List<QuestionImage>();

            foreach (var file in files)
            {
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var folderPath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
                var filePath = Path.Combine(folderPath, fileName);

                Directory.CreateDirectory(folderPath);
                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                var imageUrl = $"/uploads/{fileName}";
                uploads.Add(new QuestionImage { QuestionId = questionId, ImageUrl = imageUrl });
            }

            _context.QuestionImages.AddRange(uploads);
            await _context.SaveChangesAsync();

            return Ok(uploads.Select(i => i.ImageUrl));
        }

        [HttpPost("answer")]
        public async Task<IActionResult> UploadAnswerImages([FromForm] int answerId, [FromForm] List<IFormFile> files)
        {
            var answer = await _context.Answers.FindAsync(answerId);
            if (answer == null) return NotFound("Answer not found");

            var uploads = new List<AnswerImage>();

            foreach (var file in files)
            {
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var folderPath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
                var filePath = Path.Combine(folderPath, fileName);

                Directory.CreateDirectory(folderPath);
                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                var imageUrl = $"/uploads/{fileName}";
                uploads.Add(new AnswerImage { AnswerId = answerId, ImageUrl = imageUrl });
            }

            _context.AnswerImages.AddRange(uploads);
            await _context.SaveChangesAsync();

            return Ok(uploads.Select(i => i.ImageUrl));
        }
    }
}