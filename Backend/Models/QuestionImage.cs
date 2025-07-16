namespace FAQApp.API.Models
{
    public class QuestionImage
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;
    }
}
