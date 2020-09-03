
# Magic for ASP.NET

Magic is a scaffolding CRUD generator for .Net Core that allows you to create your .Net Core/Angular/Database Web
applications by simply clicking a button. Watch the video below for a demonstration.

<p align="center">
<a href="https://www.youtube.com/watch?v=8xO9H-2Fejc">
<img alt="Create a CRUD Web app in seconds" title="Create a CRUD Web app in seconds" src="https://servergardens.files.wordpress.com/2020/01/magic-video-screenshot.png" />
</a>
</p>

## Getting started

The simplest way to get started, is to [download its latest release](https://github.com/polterguy/magic/releases),
and use it as a _"starter kit"_. You will need.

1. [.Net Core CLI](https://dotnet.microsoft.com/download) version 3.1.300 or more
2. Some sort of database server [MySql](https://dev.mysql.com/downloads/mysql/) or [MS SQL](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express)
3. [NodeJS](https://nodejs.org/en/download/), required to serve Angular frontend
4. Install [Angular](https://angular.io/guide/setup-local) in a terminal window with `npm install -g @angular/cli`
5. [Magic](https://github.com/polterguy/magic/releases)

To start the Magic dashboard type `dotnet run` in the _"backend"_ folder. Then type `npm link` in your
_"frontend"_ folder. Start the Magic dashboard by typing `ng serve` in the _"frontend"_ folder. then go to
[http://localhost:4200](http://localhost:4200) with your browser.

## Documentation

You can rapidly [teach yourself the basics here](https://polterguy.github.io). The reference documentation you can find further down
on this page, together with the current build status, and quality gates for the project(s).

### Extending Hyperlambda

You can easily extend Hyperlambda with your own _"keywords"_ - Or _"slots"_ to be specifically. This is done by
implementing the `ISlot` interface on your class, and adding an attribute to it as follows.

```csharp
using magic.node;
using magic.signals.contracts;

namespace acme.foo
{
    [Slot(Name = "acme.foo")]
    public class Foo : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "Hello World";
        }
    }
}
```

The above will result in a slot you can invoke from Hyperlambda using the following code.

```
acme.foo
```

### Reference documentation

* [Magic Node](https://github.com/polterguy/magic.node) - Explains nodes, Hyperlambda and Expressions
* [Magic Library](https://github.com/polterguy/magic.library) - Explains how magic is tied together with ASP.NET
* [Magic Lambda Auth](https://github.com/polterguy/magic.lambda.auth) - Authentication and authorisation from Hyperlambda.
* [Magic Lambda Validators](https://github.com/polterguy/magic.lambda.validators) - Validate input in Hyperlambda.
* [Magic Lambda Strings](https://github.com/polterguy/magic.lambda.strings) - Manipulate strings in Hyperlambda
* [Magic Lambda Dates](https://github.com/polterguy/magic.lambda.dates) - Allows you to manipulate DateTime objects.
* [Magic Lambda Slots](https://github.com/polterguy/magic.lambda.slots) - Dynamically create your own slots/functions
* [Magic Lambda MySQL](https://github.com/polterguy/magic.lambda.mysql) - Accessing your MySQL server from Hyperlambda.
* [Magic Lambda MS SQL](https://github.com/polterguy/magic.lambda.mssql) - Accessing your MS SQL Server from Hyperlambda.
* [Magic Lambda Math](https://github.com/polterguy/magic.lambda.math) - Math operations from Hyperlambda.
* [Magic Lambda Logging](https://github.com/polterguy/magic.lambda.logging) - Logging from Hyperlambda.
* [Magic Lambda Caching](https://github.com/polterguy/magic.lambda.caching) - Caching from Hyperlambda.
* [Magic Lambda JSON](https://github.com/polterguy/magic.lambda.json) - Manipulating JSON from Hyperlambda.
* [Magic Lambda Mail](https://github.com/polterguy/magic.lambda.mail) - Sending and retrieving emails from Hyperlambda.
* [Magic Lambda MIME](https://github.com/polterguy/magic.lambda.mime) - Parsing email messages in Hyperlambda.
* [Magic Lambda IO](https://github.com/polterguy/magic.lambda.io) - File manipulation using Hyperlambda
* [Magic Lambda Hyperlambda](https://github.com/polterguy/magic.lambda.hyperlambda) - Parse Hyperlambda from text, and vice versa.
* [Magic Lambda HTTP](https://github.com/polterguy/magic.lambda.http) - Invoking HTTP REST endpoints from Hyperlambda.
* [Magic Lambda Crypto](https://github.com/polterguy/magic.lambda.crypto) - Cryptography helpers in Hyperlambda.
* [Magic Lambda Config](https://github.com/polterguy/magic.lambda.config) - Accessing configuration values from Hyperlambda.
* [Magic Lambda](https://github.com/polterguy/magic.lambda) - Explains all _"keywords"_ in Hyperlambda
* [Magic Lambda Scheduler](https://github.com/polterguy/magic.lambda.scheduler) - Scheduled tasks from Hyperlambda.
* [Magic IO](https://github.com/polterguy/magic.io) - IO operations in Magic.
* [Magic HTTP](https://github.com/polterguy/magic.http) - HTTP rest in Magic
* [Magic Endpoint](https://github.com/polterguy/magic.endpoint) - Endpoint resolving in Magic
* [Magic Data Common](https://github.com/polterguy/magic.data.common) - Commonalities for data adapters in Magic.

## License

Although most of Magic's source code is Open Source, you will need a license key to use it.
[You can obtain a license key here](https://servergardens.com/buy/).
Notice, 7 days after you put Magic into production, it will stop working, unless you have a valid
license for it.

* [Get licensed](https://servergardens.com/buy/)

Copyright(c) Thomas Hansen 2019 - 2020, Thomas Hansen - thomas@servergardens.com

[Quality gates for Magic and all sub projects](QUALITY.md)
