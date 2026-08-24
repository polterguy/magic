# plugins/AGENTS.md

C# plugin projects implementing Hyperlambda slots. Each plugin has a
companion `.tests` project.

## Commands

# Run one plugin's tests
cd <plugin>/<plugin>.tests && dotnet test

# Run all tests (from repo root)
dotnet test magic.sln

## Project facts

- The slot/signal pattern: C# classes register slots with
  `[Slot(Name = "...", ValueKind = "...", ValueMode = ...)]`. Hyperlambda
  invokes them by name. No direct project reference is needed between the
  Hyperlambda file and the C# slot.
- `magic.node` (Node tree) and `magic.signals` (dispatcher) are the
  foundation. Changes here ripple to every plugin — plan before touching
  them.
- `magic.library` aggregates the plugin graph and is the entry point the
  backend references. It has an `Initializer.cs` that wires plugins
  together.
- Each plugin is a separate .csproj. Adding a new plugin means adding a
  `ProjectReference` to `magic.library` or another aggregation point.
- Plugins are NuGet-packable but are consumed via ProjectReference in this
  repo.

## Risk controls

- Do not change a slot's `Name` without grepping Hyperlambda files for
  invocations — renaming a slot breaks all callers.
- Do not change `ValueKind` or `ValueMode` without checking callers' usage
  patterns.
