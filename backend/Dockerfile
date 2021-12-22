
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



# Notice, if you're super paranoid you can uncomment the lines below to make sure Magic runs in the context of
# a magic user without any privileges at all on the underlaying operating system


# RUN groupadd -r magic && useradd -g magic magic
# RUN chown -R magic:magic /magic/files/etc
# RUN chown -R magic:magic /magic/files/misc
# RUN chown -R magic:magic /magic/files/modules
# RUN chown -R magic:magic /magic/files/temp
# RUN chown -R magic:magic /magic/config
# USER magic
