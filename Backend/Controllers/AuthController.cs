using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FAQApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // Simple JWT Login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginDto)
        {
            // TODO: In production, validate against a real user database
            // This is just for demonstration
            if (loginDto.Email == "admin@example.com" && loginDto.Password == "password123")
            {
                var token = GenerateJwtToken(loginDto.Email, "Admin User");
                
                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = "1",
                        email = loginDto.Email,
                        name = "Admin User"
                    }
                });
            }

            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Azure AD login redirect
        [HttpGet("azure-login")]
        public IActionResult AzureLogin()
        {
            var clientId = _configuration["AzureAd:ClientId"];
            var tenantId = _configuration["AzureAd:TenantId"];
            var redirectUri = _configuration["AzureAd:RedirectUri"] ?? "http://localhost:3000/auth/callback";
            
            var authUrl = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize?" +
                         $"client_id={clientId}" +
                         $"&response_type=code" +
                         $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                         $"&response_mode=query" +
                         $"&scope=openid%20profile%20email" +
                         $"&state=12345";

            return Redirect(authUrl);
        }

        // Azure AD callback (to be implemented)
        [HttpPost("azure-callback")]
        public async Task<IActionResult> AzureCallback([FromBody] AzureCallbackDto callbackDto)
        {
            // TODO: Exchange authorization code for token
            // Validate the token with Azure AD
            // Create local JWT token for the user
            
            // For now, return a mock response
            return Ok(new
            {
                token = GenerateJwtToken("user@microsoft.com", "Azure User"),
                user = new
                {
                    id = "2",
                    email = "user@microsoft.com",
                    name = "Azure User"
                }
            });
        }

        private string GenerateJwtToken(string email, string name)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, name),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class AzureCallbackDto
    {
        public required string Code { get; set; }
        public string? State { get; set; }
    }
}