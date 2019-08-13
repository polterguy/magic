
# Magic IO

Magic IO is an IO module for [Magic](https://github.com/polterguy/magic). It gives your
Magic installation the ability to handle files; uploading, downloading, listing files in folders,
etc.

## Getting started

1. [Download Magic Core](https://github.com/polterguy/magic/releases) if you haven't done so already
2. [Download Magic IO](https://github.com/polterguy/magic.io/releases)
3. Unzip Magic IO into your Magic folder's _"modules"_ folder, and make sure the folder is named only _"magic.io"_
4. Add all Magic IO projects into your solution (see below)
5. Add a reference to `magic.io.web.controller` and `magic.io.services` to your backend, which is normally called _"magic.backend"_ (see below)

If you're using dotnet CLI, you can run the following commands in a terminal window from the root of your Magic installation
to add all Magic IO projects into your main Magic solution.

```
dotnet sln add modules/magic.io/magic.io.contracts/magic.io.contracts.csproj
dotnet sln add modules/magic.io/magic.io.services/magic.io.services.csproj
dotnet sln add modules/magic.io/magic.io.web.controller/magic.io.web.controller.csproj
dotnet sln add modules/magic.io/magic.io.web.model/magic.io.web.model.csproj
dotnet sln add modules/magic.io/magic.io.tests/magic.io.tests.csproj
```

To add a reference to your controller and service using the dotnet CLI, you can issue the following terminal
commands from the root of your Magic folder, assuming your main backend is called _"magic.backend"_.

```
dotnet add magic.backend reference modules/magic.io/magic.io.web.controller/magic.io.web.controller.csproj
dotnet add magic.backend reference modules/magic.io/magic.io.services/magic.io.services.csproj
```

## Configuring Magic IO

If you want to you can configure where on disc you want Magic IO to physically store your files, this
is accomplished by overriding the _"root-folder"_ for Magic IO by providing an _"appsettings.json"_
configuration such as the following illustrates.

```
  "io": {
    "root-folder": "~/some-folder/"
  }
```

The tilde (\~) above implies `Directory.GetCurrentDirectory()`, and is the root directory of your web app. You don't
need to store your files inside of your web application folder if you don't want to, you can also use an absolute path,
to anywhere on your disc. However, you must make sure the web server process somehow have access to that folder, and
that it is allowed to store and manipulate files there somehow. The default root folder for Magic IO is _"~/files/"_
if no value is explicitly provided.

## Security concerns

Magic IO is not secured out of the box, and you should apply some sort of security to it, since by default
all files that are accessible for your web server process, is also accessible to anyone having the URL
to your API endpoint. The easiest way to accomplish this, is to simply apply `[Authorize]`
to your Magic IO endpoints, which only allows authorized clients to access your files, for then to combine this
with the [Magic Auth project](https://github.com/polterguy/magic.auth). Slightly more
advanced, and probably more secure, is to make sure your web server application runs in a restricted user account
on your server, and then use your web server's authorization features to deny serving any files that your
application should not have access to for some reasons. Even better is to implement the `IAuthorize` interface,
that you can find in the _"magic.io.contracts"_ namespace/project, and then do some sort of switch/case
based upon the `AccessType`, and the username/roles/path to the file/folder you want to have authorized
access to.

## Licensing

Magic IO is licensed as Affero GPL, which implies that you can only use it to create Open Source software - However, a proprietary
enabling license can be obtained for €50 by following [this PayPal link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS) and
pay me €50 - At which point you are free to create _one_ closed source web app. If you want to create multiple closed source web APIs using Magic IO, you'll
have to purchase one license for each web API project you want to create.

* [Purchase closed source license for €50](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS)

Notice, without a closed source license, your code automatically becomes Open Source, and you'll have to provide a link to your own source code from any website(s),
and/or application(s) from where you are consuming your Magic web API. With a closed source license, you can create closed source code, and you don't have to provide
a link to neither me, nor your own source code.

> Send more Champagne

Quote by Karl Marx
