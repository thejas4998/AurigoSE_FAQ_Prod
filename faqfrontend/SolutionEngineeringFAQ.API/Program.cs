using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FAQApp.API.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Load configuration with defaults for development
var simpleJwtKey = builder.Configuration["Jwt:Key"] ?? "your-256-bit-secret-key-for-development-only!";
var simpleJwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "FAQApp";
var azureTenantId = builder.Configuration["AzureAd:TenantId"];
var azureClientId = builder.Configuration["AzureAd:ClientId"];

// 2. Add services
builder.Services.AddControllers();

builder.Services.AddHttpClient();
// Add SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=FAQApp.db"));

// 3. Add Authentication - Simple JWT as default
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Simple"; // Use Simple JWT as default
    options.DefaultAuthenticateScheme = "Simple";
    options.DefaultChallengeScheme = "Simple";
})
.AddJwtBearer("Simple", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = simpleJwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(simpleJwtKey)),
        ClockSkew = TimeSpan.Zero // Optional: Remove default 5 min clock skew
    };
    
    // Add event handlers for debugging
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"Token authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"Token validated for user: {context.Principal?.Identity?.Name}");
            return Task.CompletedTask;
        }
    };
});

// Only add Azure AD if configured
if (!string.IsNullOrEmpty(azureTenantId) && !string.IsNullOrEmpty(azureClientId))
{
    builder.Services.Configure<JwtBearerOptions>("AzureAD", options =>
    {
        options.Authority = $"https://login.microsoftonline.com/{azureTenantId}/v2.0";
        options.Audience = azureClientId;
    });
}

// 4. Authorization - Simplified for now
builder.Services.AddAuthorization();

// 5. Swagger & CORS
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Add JWT authentication to Swagger
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Please enter token",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // React app URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Important for cookies/auth
    });
});

// 6. Build app
var app = builder.Build();

// Create database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// 7. Middleware (ORDER MATTERS!)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // For serving uploaded images

app.UseRouting();
app.UseCors("AllowFrontend"); // CORS must come before Authentication

app.UseAuthentication(); // This must come before UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();