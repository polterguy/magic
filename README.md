
# Super DRY Magic for ASP.NET Core

Magic is a Super DYR starter kit for your ASP.NET Core web APIs, that brings the ideas of DRY (_"Don't Repeat Yourself"_) to a new level.
If you follow a small recipe as you create your controller endpoints, services, view models, and database models, you will literally
start out with 80% of your job done, and you can wrap any CRUD operations into your HTTP REST endpoints almost without coding.
The project's purpose is to be a starter kit for your own projects, allowing you to _"hit the ground
running"_.

<p align="center">
<a href="https://www.youtube.com/watch?v=M3uKdPAvS1I">
<img alt="A 10 minutes demonstration of Magic" title="A 10 minutes demonstration of Magic" src="https://phosphorusfive.files.wordpress.com/2019/03/magic-youtube-screenshot.png" />
</a>
</p>

## Getting started

* [Download Magic](https://github.com/polterguy/magic/releases)
* Unzip and open _"magic.sln"_
* Start your debugger

## No code, no bugs, no problems

The whole idea is that Magic allows you to create all CRUD operations on your web APIs, without having to code. This is possible due
to that HTTP and SQL are basically just fundamentally CRUD operations. Hence, your controller endpoints will end up looking like the following.

```csharp
[Route("api/todo")]
public class TodoController : CrudController<www.Todo, db.Todo>
{
    public TodoController(ITodoService service)
        : base(service)
    { }
}
```

While your service implementation will resemble the following.

```csharp
public class TodoService : CrudService<Todo>, ITodoService
{
    public TodoService(ISession session)
        : base(session)
    { }
}
```

Even your service interface ends up empty.

```csharp
public interface ITodoService : ICrudService<Todo>
{ }
```

At which point all you need to do, is to model your database model, such as the following illustrates.

```csharp
public class Todo : Model
{
    public virtual string Header { get; set; }
    public virtual string Description { get; set; }
    public virtual bool Done { get; set; }
}
```

And map it to your database using something resembling the following.

```csharp
public class TodoMap : ClassMap<Todo>
{
    public TodoMap()
    {
        Table("todos");
        Id(x => x.Id);
        Map(x => x.Header).Not.Nullable().Length(256);
        Map(x => x.Description).Not.Nullable().Length(4096);
        Map(x => x.Done).Not.Nullable();
    }
}
```

For then to create a view model looking like the following.

```csharp
public class Todo
{
    public Guid? Id { get; set; }
    public string Header { get; set; }
    public string Description { get; set; }
    public bool Done { get; set; }
}
```

And then make sure you resolve your service implementation to your service interface.

```csharp
public class Initializer : IInitialize
{
    public void Initialize(IServiceCollection services)
    {
        services.AddTransient<ITodoService, TodoService>();
    }
}
```

See the _"/modules/magic.todo/"_ folder for more details about how to create your own CRUD modules.

Notice, without adding more than one line of actual _"code"_, we were still able to create all CRUD HTTP REST endpoints for our domain type,
arguably _"magically"_, without actually adding any code per se. This is possible due to intelligent use of polymorphism and C# generics, which
allows our code to become _"Super DRY"_.

## Invoking HTTP REST methods

Magic also contains an HTTP client wrapper, that
allows you to create HTTP REST requests with a single line of code. This class uses some intelligent generic constructs,
to automatically transform from any DTO type you have to JSON, and vice versa. You can consume this service as an
`IHttpClient` instance. You can find the HTTP client in the _"magic.http"_ folder. Below is some example code to
illustrate its usage.

```csharp
// Your input type
class RequestDTO
{
    public string Foo { get; set; }
}

// Your output type
class ResponseDTO
{
    public string Bar { get; set; }
}

// Your input object
var input = new RequestDTO
{
    Foo = "some string"
};

// Client is an instance of an IHttpClient, and can be retrieved using dependency injection
var result = await client.PostAsync<RequestDTO, ResponseDTO>("https://somewhere.com/api", input);

// "result" is now of type "ResponseDTO".
```

You can also optionally pass in a _"Bearer"_ Authorize token when invoking methods on this service, and
you can also GET files as streams, or PUT and POST Streams, at which point the implementation will not
load the entire contents of the stream into memory. This allows you to download large files, and/or
submit large files, without exhausting the memory of your client.

## Signal over spaghetti

Magic contains a basic _"signal"_ implementation, that allows you to create a _"signal"_ from one module, that you can subscribe to using a _"slot"_ in
another module, without bringing in dependencies between your two different modules at all. The basic way to implement this is as follows.

```csharp
using System;
using magic.signals.contracts;

[Slot(Name = "foo.bar")]
public class FooBarSlot : ISlot
{
    public void Signal(JObject input)
    {
        var foo = input["foo"].Value<Guid>();
        /* ... do stuff with foo here ... /*
    }
}
```

Then somewhere else in your application, in a completely different module, you can do the following.

```csharp
using System;
using magic.signals.contracts;

public class FooBarSignaler
{
    readonly ISignaler _signaler;

    public FooBarSignaler(ISignaler signaler)
    {
        _signaler = signaler;
    }

    public void DoFooBar(Guid foo)
    {
        _signaler.Signal("foo.bar", new JObject
        {
            ["foo"] = foo,
        });
    }
}
```

Once you invoke the `ISignaler.Signal` method, the `FooBarSlot.Signal` method will be invoked, because its `Slot.Name` happens to be the name
of the _"signal"_ we raise inside of `DoFooBar`. No dependencies are required between the two different modules, and this works for all practical
concerns as an event mechanism across modules, while still keeping a loosely coupled implementation, without dependencies between the two different
modules. This allows any module of yours to communicate with any other module in your app, without having to bring in dependencies between the two,
as long as they communicate exclusively using signals and slots, only passing data in through their `JObject` input. Data as in strings, date objects,
integers, etc ...

## .NET Core CLI Template

This repository also includes a .NET Core CLI template which can be installed by:

* Download and unzip the latest version
* Open a terminal in the parent folder of the repo
  * i.e. one level above the root of the repo
  * if you unzipped to `~/code/magic`, then open the terminal at `~/code/`
* Run the following command: `dotnet new --install ./magic`

This will install the contents of this repo as a template, which you can use alongside the .NET Core CLI in the following manner:

`dotnet new magic --name foo`

After the scaffolding process completes, you will find a copy of the code base in 
the `./foo/` folder. The `--name` switch will take care of full namespace replacement.

## Technology

Magic supports MySQL, MSSQL and SQLIte out of the box, but adding support for your own relational database type, can be done with three lines
of code. This is possible due to the usage of Fluent nHibernate. Magic is built upon the following open source projects.

* [Fluent nHibernate](https://github.com/FluentNHibernate/fluent-nhibernate)
* [Mapster](https://github.com/MapsterMapper/Mapster)
* [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [log4net](https://logging.apache.org/log4net/)

You will probably benefit from understanding these projects as you proceed to create your own projects.

## HOWTO wrap a database table

1. Create a folder in _"modules"_ to contain your module's components
2. Create your database model class(es). See `magic.todo.model` for an example.
3. Create your contract (service interface). See the `magic.todo.contracts` for an example.
4. Create your service implementation. See `magic.todo.services` for an example.
5. Create your view model. See the `magic.todo.web.model` project for an example.
6. Create your controller. See the `magic.todo.web.controller` project for an example.
7. Add a reference to your controller and service into the `magic.backend`.
8. Configure your `IServiceCollection` in for instance a class implementing `IConfigureServices`.

## Changing database provider

To change database provider is easy. Open up _"appsettings.config"_ in your _"magic.backend"_ project, and change the `database` section to whatever
database provider you want to use, and the connection string to your database. Notice, Magic will automatically create the database
schema itself according to your `ClassMap` definition(s). Supported database drivers are as follows.

* `MySQL` - Make sure you use a connection string to an existing MySQL database instance
* `MSSQL` - Microsoft SQL Server
* `SQLIte` - SQLIte database (this is the default)

In addition, most different dialects of MS SQL is supported.

## Additional modules

* [Auth module](https://github.com/polterguy/magic.auth) - Add authentication and authorization features to your app
* [IO module](https://github.com/polterguy/magic.io) - Helps you handle files and folders in your installation
* [Email module](https://github.com/polterguy/magic.email) - Giving you a webmail backend for retrieving emails from POP3 accounts and sending emails over SMTP
* [Affiliate cookie module](https://github.com/polterguy/magic.cookie) - Gives you the ability to easily create affiliate tracking cookies

The above modules comes in addition to the example TODO module, and the common modules, allowing you to easily create any CRUD modules, and create signals and slots across module boundaries. Below is an example of how to use Magic to create a file
upload/download HTTP REST web API, that securely gives you access to most of the important functionality from
within `System.IO`.

<p align="center">
<a href="https://www.youtube.com/watch?v=Xn459G1WaXc">
<img alt="Creating an HTTP REST web API upload/download controller in 7 seconds" title="Creating an HTTP REST web API upload/download controller in 7 seconds" src="https://phosphorusfive.files.wordpress.com/2019/04/magic-io-screenshot.png" />
</a>
</p>

## Credits

Thanks to the following contributors.

* [Jamie Taylor](https://github.com/GaProgMan), who also have an [awesome podcast](https://dotnetcore.show/author/jamie/) and [blog](https://dotnetcore.gaprogman.com/) about .Net Core who contributed the CLI template.

## Licensing

Magic is licensed as Affero GPL, which implies that you can only use it to create Open Source software - However, a proprietary
enabling license can be obtained for €50 by following [this PayPal link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS) and
pay me €50 - At which point you are free to create _one_ closed source web app. If you want to create multiple closed source web APIs using Magic, you'll
have to purchase one license for each web API project you want to create.

* [Purchase closed source license for €50](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS)

Notice, without a closed source license, your code automatically becomes Open Source, and you'll have to provide a link to your own source code from any website(s),
and/or application(s) from where you are consuming your Magic web API. With a closed source license, you can create closed source code, and you don't have to provide
a link to neither me, nor your own source code.

> Send more Champagne

Quote by Karl Marx
