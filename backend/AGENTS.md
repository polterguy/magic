# backend/AGENTS.md

ASP.NET Core backend — the API and Hyperlambda runtime. Entry point is
`Program.cs`.

## Commands

# Run the backend (builds + starts on http://localhost:5000)
dotnet run

# Build only
dotnet build

## Project facts

- Target framework: net10.0
- `backend.csproj` copies `files/**` to the output directory with
  PreserveNewest. The `files/` tree is runtime content, not a build
  artifact — editing it changes behavior without a rebuild.
- The backend references only three plugin projects directly
  (magic.lambda.python, magic.lambda.system, magic.library). Other plugins
  arrive transitively through magic.library.
- Config lives in `files/config/appsettings.json`. Environment variables
  override JSON values at runtime (ASP.NET Core convention).
- The `slots/` directory contains C# slot implementations registered at
  startup.
- SQLite native plugins in `sqlite-plugins/` are platform-specific
  binaries matched to the host OS and architecture.

## Risk controls

- `files/config/appsettings.json` contains live secrets and is git-tracked.
  Do not commit changes to it.
- Default credentials are root/root. Do not change them in tracked config.
