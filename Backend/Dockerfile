# Use .NET 8 SDK for build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY SolutionEngineeringFAQ.API.csproj ./SolutionEngineeringFAQ.API/
RUN dotnet restore ./SolutionEngineeringFAQ.API/SolutionEngineeringFAQ.API.csproj

# Copy the rest and publish
COPY . ./SolutionEngineeringFAQ.API/
WORKDIR /src/SolutionEngineeringFAQ.API
RUN dotnet publish -c Release -o /app/publish

# Use .NET 8 runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SolutionEngineeringFAQ.API.dll"]