using System.ComponentModel.DataAnnotations.Schema;

namespace FAQApp.API.Models
{
    public class AnswerImage
    {
        public int Id { get; set; }

        public string ImageUrl { get; set; } = null!;

        [ForeignKey("Answer")]
        public int AnswerId { get; set; }

        public Answer Answer { get; set; } = null!;
    }
}
