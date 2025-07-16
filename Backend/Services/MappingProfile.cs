using AutoMapper;
using FAQApp.API.Models;
using SolutionEngineeringFAQ.API.DTOs;

namespace FAQApp.API.Services
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Question, QuestionDto>()
                .ForMember(dest => dest.ImageUrls, opt => opt.MapFrom(src => src.Images.Select(i => i.ImageUrl)))
                .ForMember(dest => dest.Answers, opt => opt.MapFrom(src => src.Answers));

            CreateMap<Answer, AnswerDto>()
                .ForMember(dest => dest.ImageUrls, opt => opt.MapFrom(src => src.Images.Select(i => i.ImageUrl)))
                .ForMember(dest => dest.UpvoteCount, opt => opt.MapFrom(src => src.Votes.Count(v => v.IsUpvote)))
                .ForMember(dest => dest.DownvoteCount, opt => opt.MapFrom(src => src.Votes.Count(v => !v.IsUpvote)))
                .ForMember(dest => dest.UserVote, opt => opt.Ignore()); // We'll handle UserVote manually
        }
    }
}
