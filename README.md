
# Super DRY Magic for ASP.NET Core

Magic is a Super DYR starter kit for your ASP.NET Core web APIs, that brings the ideas of DRY (_"Don't Repeat Yourself"_) to a new level.
If you follow a small recipe as you create your controller endpoints, services, view models, and database models, you will literally
start out with 80% of your job done, and you can wrap any CRUD operations into your HTTP REST endpoints extremely rapidly.
The project's purpose is to be a starter kit for your own projects, allowing you to _"hit the ground
running"_. Magic is best suited for database applications.

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
        : base(session, LogManager.GetLogger(typeof(TodoService)))
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

And then make sure Ninject is using your service implementation, by creating something resembling the following.

```csharp
public class Initializer : IInitialize
{
    public void Initialize(IKernel kernel)
    {
        kernel.Bind<ITodoService>().To<TodoService>();
    }
}
```

Notice, without adding more than one line of actual _"code"_, we were still able to create all CRUD HTTP REST endpoints for our domain type,
arguably _"magically"_, without actually adding any code per se. This is possible due to intelligent use of polymorphism and C# generics, which
allows our code to become _"Magically DRY"_.

Out of the box Magic is a simple HTTP REST TODO web api, but this is only there to serve as an example. Remove the existing TODO code,
and replace it with your own code, and you'll literally _hit the ground running_. All parts of your application can easily be modified, extended,
or changed, by simply overriding that which you need to override. In such a way Magic provides you with a consistent API, allowing you to
extend and modify that which you need to modify, and having the rest done automagically for you through the powers of Magic. And, everything even
becomes automagically documented for you.

In addition, since each HTTP REST endpoint ends up having the exact same API from the client's perspective, adding similar constructs in your
service layer in for instance Angular becomes easy. Out of the box similar construct are also applied to your unit tests, allowing you
to create unit tests generically, by inheriting from intelligent base classes, giving all your controllers unit tests _"magically out of the box"_,
almost without having to create code.

## .NET Core CLI Template

This repository also includes a .NET Core CLI template which can be installed by:

* Download and unzip the latest version
* Open a terminal in the parent folder of the repo
  * i.e. one level above the root of the repo
  * if you unzipped to `~/code/magic`, then open the terminal at `~/code/`
* Run the following command: `dotnet new --install ./magic`

This will install the contents of this repo as a template, which you can use alongside the .NET Core CLI in the following manner:

`dotnet new magic --help`

This will show the list of command line switches which are available, along with descriptions and their default values.
Creating a new instance of the magic code base is as simple as issuing the following command:

`dotnet new magic --name foo`

After the scaffolding process completes, you will find a copy of the code base in 
the `./foo/` folder. The `--name` switch will take care of full namespace replacement, and the optional switches will have their
default values supplied. As an example of how to override them, here is the same command but with some of the optional switches provided:

`dotnet new magic --name PodCast -acn "Jamie Taylor" -ace "jamie@gaprogman.com" -acu "https://dotnetcore.show"`

## Technology

Magic supports MySQL, MSSQL and SQLIte out of the box, but adding support for your own relational database type, can be done with three lines
of code. This is possible due to the usage of Fluent nHibernate. Magic relies upon the following projects.

* [Fluent nHibernate](https://github.com/FluentNHibernate/fluent-nhibernate)
* [Ninject](http://www.ninject.org/)
* [Mapster](https://github.com/MapsterMapper/Mapster)
* [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [log4net](https://logging.apache.org/log4net/)

You will probably benefit from understanding these projects as you proceed to create your own projects. However, Magic itself, can easily be
completely understood in 20 minutes for an experienced C# developer. The whole idea with Magic, is to use existing best practices, coupled
with intelligent OOP constructs, based arguably upon C# generic _"trickery"_, to completely eliminate the need for coding, through the powers of DRY Magic -
Yet still have perfect control over your end solution(s). Creating similar constructs in your client layer, using e.g. Angular or React, is also easily
done, since your HTTP REST CRUD endpoints all ends up having the exact same API. In such a way, Magic completely eliminates the need to create any CRUD
code for you, making you 10x as productive when creating database wrapper web API apps.

## HOWTO wrap a database table

1. Create your database model class(es) in the _"model"_ folder. See `magic.model.todo` for an example.
2. Make sure you create a `ClassMap` for your model, mapping your type to your database.
3. Create your contract (service interface) in the _"contracts"_ folder. Make sure it inherits from `ICrudService`. See the `magic.contracts.todo` for an example.
4. Create your service implementation in the _"services"_ folder, and inherit your service from `CrudService`. See `magic.services.todo` for an example.
5. Create your view model in the _"web/model"_ folder. See the `magic.web.model.todo` project for an example.
6. Create your controller in the _"web/controller"_ folder, and inherit it from the `CrudController` class. See the `magic.web.controller.todo` project for an example.
7. Add a reference to your controller into the `magic.backend` project and add the name of your assembly into the `plugins` section of the _"appsettings.json"_ file.
8. Make sure you create a mapping between your service interface and yur service implementation in some IInitialize implementation class

## Overriding Magic with your own custom functionality

If you want to modify some service, you can easily override whatever method you want to override in your service implementation.
You can also add new service methods, by adding a method to your service interface. In addition, you can also override your web controller methods,
and for instance add the `[Authorize]` attribute, or change other parts of its behavior somehow. In general, all parts of Magic are overridable, while still
providing _"sane defaults"_ for you out of the box.

## Changing database provider

To change database provider is easy. Open up _"appsettings.config"_ in your _"magic.backend"_ project, and change the `database` section to whatever
database provider you want to use, and the connection string to your database. Notice, in debug builds Magic will automatically create the database
schema itself accoding to your `ClassMap` definition(s), but in release builds it will not do this. Supported database drivers are as follows.

* `MySQL` - Make sure you use a connection string to an existing MySQL database instance
* `MSSQL` - Microsoft SQL Server
* `SQLIte` - SQLIte database (this is the default, and probably _not_ something you'd like to use in a real app)

Ohh yeah, and of course Magic is as portable as it is possible to be. Most projects are .Net Standard 2.0, and you can
deploy it on any server you wish, ranging from Linux and Windows, to your Mom's toaster if it runs some Linux web server.

## Modules

I will be creating additional modules for Magic every now and then, as I see the need. I'll try to link these in
here as I wrap them up.

* [Email module](https://github.com/polterguy/magic.email) giving you a webmail backend for retrieving emails from
POP3 accounts and sending emails over SMTP.

## Credits

Thanks to the following contributors.

* [Jamie Taylor](https://github.com/GaProgMan), who also have an [awesome podcast](https://dotnetcore.show/author/jamie/) and [blog](https://dotnetcore.gaprogman.com/) about .Net Core who contributed the CLI template.

## Licensing, buy me a bottle of Champagne

Magic is licensed as Affero GPL, which implies that you can only use it to create Open Source software - However, a proprietary
enabling license can be obtained for €50 by following [this PayPal link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS) and
pay me €50 - At which point you are free to create _one_ closed source web app. If you want to create multiple closed source web APIs using Magic, you'll
have to purchase one license for each web API project you want to create.

* [Purchase closed source license for €50](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MD8B9E2X638QS)

Notice, without a closed source license, your code automatically becomes Open Source, and you'll have to provide a link to your own source code from any website(s),
and/or application(s) from where you are consuming your Magic web API. With a closed source license, you can create closed source code, and you don't have to provide
a link to neither me, nor your own source code.

You might also probably find me slightly more helpful and friendly in case you [require help or support](https://github.com/polterguy/magic/issues),
if you can show me somehow that you have purchased a closed source license - In addition to that you get that warm and fuzzy feeling of having contributed to
my Champagne budget.

> Send more Champagne

Quote by Karl Marx
