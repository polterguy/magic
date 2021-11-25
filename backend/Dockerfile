
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

# Final stage / image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /magic
COPY --from=build /magic ./
EXPOSE 4444
ENV ASPNETCORE_URLS="http://+:4444"
ENTRYPOINT ["dotnet", "backend.dll"]

# To be able to start other docker containers we will need to install Docker in container itself.
# NOTICE! Not sure if this will work on Windows!
RUN apt-get update
RUN apt-get -y install apt-transport-https ca-certificates curl gnupg2 software-properties-common
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
RUN apt-get update
RUN apt-get -y install docker-ce
RUN apt-get -y install docker-compose
RUN bash service docker start
