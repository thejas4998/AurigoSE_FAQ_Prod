namespace SolutionEngineeringFAQ.API.DTOs
{
    public class ChatbotQueryDto
    {
        public required string Message { get; set; }
    }

    public class ChatbotResponseDto
    {
        public required string Response { get; set; }
        public List<RelatedQuestionDto> RelatedQuestions { get; set; } = new List<RelatedQuestionDto>();
    }

    public class RelatedQuestionDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Body { get; set; }
        public required string Category { get; set; }
        public List<string> AnswerBodies { get; set; } = new List<string>();
    }
}