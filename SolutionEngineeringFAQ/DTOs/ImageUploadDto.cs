using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace SolutionEngineeringFAQ.API.DTOs
{
    public class ImageUploadDto
    {
        public int EntityId { get; set; } // QuestionId or AnswerId
        public List<IFormFile> Files { get; set; } = new();
    }
}