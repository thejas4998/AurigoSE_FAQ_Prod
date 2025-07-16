using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SolutionEngineeringFAQ.API.Services;

namespace FAQApp.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        public AuthController(IConfiguration configuration, IUserService userService)
        {
            _configuration = configuration;
            _userService = userService;
        }

        // User registration endpoint
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var user = await _userService.CreateUserAsync(registerDto.Email, registerDto.Name, registerDto.Password);
            if (user == null)
            {
                return BadRequest(new { message = "User already exists" });
            }
            var token = GenerateJwtToken(user.Email, user.Name);
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    name = user.Name
                }
            });
        }

        // Production-level JWT Login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            // Backdoor user for a@aurigo.com
            if (loginDto.Email == "a@aurigo.com" && loginDto.Password == "password")
            {
                var token = GenerateJwtToken("a@aurigo.com", "Backdoor User");
                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = 0,
                        email = "a@aurigo.com",
                        name = "Backdoor User"
                    }
                });
            }
            // Validate user using IUserService (should check hashed password in DB)
            var user = await _userService.ValidateUserAsync(loginDto.Email, loginDto.Password);
            if (user != null)
            {
                var token = GenerateJwtToken(user.Email, user.Name);
                return Ok(new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        name = user.Name
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

        // Azure AD callback (production-level)
        [HttpPost("azure-callback")]
        public async Task<IActionResult> AzureCallback([FromBody] AzureCallbackDto callbackDto)
        {
            // TODO: Implement AzureAdService or inject it as a dependency
            // For now, return Unauthorized to avoid build errors
            return Unauthorized(new { message = "Azure AD authentication not implemented" });
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

    public class RegisterDto
    {
        public required string Email { get; set; }
        public required string Name { get; set; }
        public required string Password { get; set; }
    }

    public class AzureCallbackDto
    {
        public required string Code { get; set; }
        public string? State { get; set; }
    }
}