
# Using .Net 5 image from Microsoft
FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY backend.csproj .
RUN dotnet restore

# Copy everything else and build website
COPY . .
WORKDIR /app
RUN dotnet publish backend.csproj -c release -o /magic

# Final stage / image
FROM mcr.microsoft.com/dotnet/aspnet:5.0
WORKDIR /magic
COPY --from=build /magic ./
EXPOSE 4444
ENV ASPNETCORE_URLS="http://+:4444"
ENTRYPOINT ["dotnet", "backend.dll"]
