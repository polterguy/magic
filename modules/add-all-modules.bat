
dotnet sln ../magic.sln add magic.auth/magic.auth.contracts/magic.auth.contracts.csproj
dotnet sln ../magic.sln add magic.auth/magic.auth.model/magic.auth.model.csproj
dotnet sln ../magic.sln add magic.auth/magic.auth.services/magic.auth.services.csproj
dotnet sln ../magic.sln add magic.auth/magic.auth.web.controller/magic.auth.web.controller.csproj
dotnet sln ../magic.sln add magic.auth/magic.auth.web.model/magic.auth.web.model.csproj
dotnet sln ../magic.sln add magic.auth/magic.auth.tests/magic.auth.tests.csproj

dotnet add ../magic.backend reference magic.auth/magic.auth.web.controller/magic.auth.web.controller.csproj
dotnet add ../magic.backend reference magic.auth/magic.auth.services/magic.auth.services.csproj

dotnet sln ../magic.sln add magic.io/magic.io.contracts/magic.io.contracts.csproj
dotnet sln ../magic.sln add magic.io/magic.io.services/magic.io.services.csproj
dotnet sln ../magic.sln add magic.io/magic.io.web.controller/magic.io.web.controller.csproj
dotnet sln ../magic.sln add magic.io/magic.io.web.model/magic.io.web.model.csproj
dotnet sln ../magic.sln add magic.io/magic.io.tests/magic.io.tests.csproj

dotnet add ../magic.backend reference magic.io/magic.io.web.controller/magic.io.web.controller.csproj
dotnet add ../magic.backend reference magic.io/magic.io.services/magic.io.services.csproj

dotnet sln ../magic.sln add magic.email/magic.email.contracts/magic.email.contracts.csproj
dotnet sln ../magic.sln add magic.email/magic.email.model/magic.email.model.csproj
dotnet sln ../magic.sln add magic.email/magic.email.services/magic.email.services.csproj
dotnet sln ../magic.sln add magic.email/magic.email.web.controller/magic.email.web.controller.csproj
dotnet sln ../magic.sln add magic.email/magic.email.web.model/magic.email.web.model.csproj
dotnet sln ../magic.sln add magic.email/magic.email.tests/magic.email.tests.csproj

dotnet add ../magic.backend reference magic.email/magic.email.web.controller/magic.email.web.controller.csproj
dotnet add ../magic.backend reference magic.email/magic.email.services/magic.email.services.csproj

dotnet sln ../magic.sln add magic.cookie/magic.cookie.contracts/magic.cookie.contracts.csproj
dotnet sln ../magic.sln add magic.cookie/magic.cookie.services/magic.cookie.services.csproj
dotnet sln ../magic.sln add magic.cookie/magic.cookie.web.controller/magic.cookie.web.controller.csproj

dotnet add ../magic.backend reference magic.cookie/magic.cookie.web.controller/magic.cookie.web.controller.csproj
dotnet add ../magic.backend reference magic.cookie/magic.cookie.services/magic.cookie.services.csproj
