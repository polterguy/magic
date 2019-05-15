
# Magic Modules

Contains all your modules, which are dynamically injected plugins to your _"magic.backend"_ main ASP.NET Core web API project.
Magic contains several additional modules that you can install to add additional features to your starter-kit experience.
For a full list of which modules exists, check out the README.md file at the root of your download.

To create your own custom CRUD module, you can have a look at the _"magic.todo"_ module, that illustrates how to rapidly wrap
all CRUD operations in a database table into an HTTP REST API. The following modules are special modules, and intended for being
consumed by your other modules.

1. **magic.common** ==> Contains common CRUD helper classes to rapidly create a database CRUD API
2. **magic.http** ==> Contains an HTTP client that allows you to invoke other HTTP endpoints with a single line of C# code
3. **magic.signals** ==> Contains a _"super signal"_ implementation, allowing your modules to interact with each other, without sharing as much as a POCO type reference
4. **magic.tests** ==> Contains unit test helpers, that among other things allows you to use an in-memory SQLite database for database operations


