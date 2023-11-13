
# Using .Net 6 image from Microsoft
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY backend.csproj .
RUN dotnet restore

# Copy everything else and build website
COPY . .
WORKDIR /app
RUN dotnet publish backend.csproj -c release -o /magic

# Making sure we add all SQLite plugins to docker image.
ADD sqlite-plugins /magic/sqlite-plugins

# Making sure we run apt-get to get necessary requirements for SQLite plugins
RUN apt-get update
RUN apt-get install -y libgomp1 libatlas-base-dev liblapack-dev

# Making sure we run in the context of a custom user with restricted access to core operating system
RUN groupadd -r magic && useradd -g magic magic
RUN chown -R magic:magic /magic
USER magic

# Final stage / image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /magic
COPY --from=build /magic ./
EXPOSE 4444
ENV ASPNETCORE_URLS="http://+:4444"
ENTRYPOINT ["dotnet", "backend.dll"]
