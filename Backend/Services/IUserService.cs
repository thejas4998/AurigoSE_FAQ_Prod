using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FAQApp.API.Data;
using FAQApp.API.Models;


namespace SolutionEngineeringFAQ.API.Services
{
    public interface IUserService
    {
        Task<User?> ValidateUserAsync(string email, string password);
        Task<User?> FindOrCreateAzureUserAsync(User azureUserInfo); // For Azure AD integration
        Task<User?> CreateUserAsync(string email, string name, string password);
    }

    public class UserService : IUserService
    {
        private readonly AppDbContext _dbContext;
        public UserService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // Create a new user with hashed password
        public async Task<User?> CreateUserAsync(string email, string name, string password)
        {
            // Check if user already exists
            var existing = _dbContext.Users.SingleOrDefault(u => u.Email == email);
            if (existing != null)
                return null;

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<FAQApp.API.Models.User>();
            var userEntity = new FAQApp.API.Models.User
            {
                Email = email,
                Name = name,
                PasswordHash = ""
            };
            userEntity.PasswordHash = hasher.HashPassword(userEntity, password);

            _dbContext.Users.Add(userEntity);
            await _dbContext.SaveChangesAsync();

            return new User
            {
                Id = userEntity.Id.ToString(),
                Email = userEntity.Email,
                Name = userEntity.Name
            };
        }

        // Securely validate user credentials using hashed passwords
        public async Task<User?> ValidateUserAsync(string email, string password)
        {
            var userEntity = _dbContext.Users.SingleOrDefault(u => u.Email == email);
            if (userEntity == null)
                return null;

            // Use ASP.NET Core's PasswordHasher for secure password comparison
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<FAQApp.API.Models.User>();
            var result = hasher.VerifyHashedPassword(userEntity, userEntity.PasswordHash, password);
            if (result == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success)
            {
                return new User
                {
                    Id = userEntity.Id.ToString(),
                    Email = userEntity.Email,
                    Name = userEntity.Name
                };
            }
            return null;
        }

        // For Azure AD integration: create or update user in DB
        public async Task<User?> FindOrCreateAzureUserAsync(User azureUserInfo)
        {
            var userEntity = _dbContext.Users.SingleOrDefault(u => u.Email == azureUserInfo.Email);
            if (userEntity == null)
            {
                userEntity = new FAQApp.API.Models.User
                {
                    Email = azureUserInfo.Email,
                    Name = azureUserInfo.Name,
                    PasswordHash = "" // No password for Azure AD users
                };
                _dbContext.Users.Add(userEntity);
                await _dbContext.SaveChangesAsync();
            }
            return new User
            {
                Id = userEntity.Id.ToString(),
                Email = userEntity.Email,
                Name = userEntity.Name
            };
        }
    }

    public class User
    {
        public string Id { get; set; } = "";
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
    }
}