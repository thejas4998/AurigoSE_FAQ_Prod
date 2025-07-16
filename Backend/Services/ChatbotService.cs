using System.Text;
using System.Text.Json;
using FAQApp.API.Models;
namespace FAQApp.API.Services
{
    public class ChatbotService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatbotService> _logger;
        private readonly HttpClient _httpClient;

        public ChatbotService(IConfiguration configuration, ILogger<ChatbotService> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<string> CallLLM(string context)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];
            var apiUrl = _configuration["Anthropic:ApiUrl"] ?? "https://api.anthropic.com/v1/messages";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Anthropic API key not configured. Using fallback response.");
                return GenerateFallbackResponse(context);
            }

            try
            {
                var requestBody = new
                {
                    model = "claude-3-5-sonnet-20241022",
                    max_tokens = 500,
                    temperature = 0.7,
                    messages = new[]
                    {
                        new { role = "user", content = $"You are a helpful FAQ assistant. Please help with: {context}" }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Headers.Add("x-api-key", apiKey);
                request.Headers.Add("anthropic-version", "2023-06-01");
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
                        .GetProperty("content")[0]
                        .GetProperty("text")
                        .GetString();

                    return llmResponse ?? "I couldn't generate a response.";
                }
                else
                {
                    _logger.LogError($"Anthropic API call failed with status: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error details: {errorContent}");
                    return GenerateFallbackResponse(context);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Anthropic Claude API");
                return GenerateFallbackResponse(context);
            }
        }

        public string GenerateFallbackResponse(string context)
        {
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

        public static string PrepareContextForLLM(List<Question> questions, string userQuery)
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
                    foreach (var answer in question.Answers.Take(3))
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
    }
}
