
# Magic, create your next ASP.NET Core web API in 5 minutes

Magic is a starter kit for your ASP.NET Core web APIs, that brings the ideas of DRY (_"Don't Repeat Yourself"_) to an extreme level.
If you follow a small recipe as you create your controller endpoints, services, view models, and database models, you will literally
start out with 80% of your job done. The project is hence in such a way a template for your own projects, allowing you to _"hit the ground
running"_ as you start out your next project. Magic is best suited for database applications, where you need to wrap your database tables,
and present these to some client, using an HTTP REST API. Basically, for all your CRUD needs, all you need to do to create your Magic wrapper,
is to create a service, a contract (service interface), a controller, and declare your models (view model and database model). After
you have correctly declared these types, Magic simply takes care of the rest for you automagically. You don't even need to create your
database. Even creating your database will be automagically done by Magic.

<p align="center">
<a href="https://www.youtube.com/watch?v=M3uKdPAvS1I">
<img alt="A 10 minutes demonstration of Magic" title="A 10 minutes demonstration of Magic" src="https://phosphorusfive.files.wordpress.com/2019/03/magic-youtube-screenshot.png" />
</a>
</p>

Out of the box Magic is a simple HTTP REST TODO web api, but this is only there to serve as an example. Remove the existing TODO projects,
and replace it with your own code, and you'll literally _hit the ground running_. All parts of your application can easily be modified, extended,
or changed, by simply overriding that which you need to override. In such a way Magic provides you with a consistent API, allowing you to
extend and modify that which you need to modify, and having the rest done automagically for you through the powers of Magic. And, everything even
becomes automagically documented for you!

## Getting started

* [Download Magic](https://github.com/polterguy/magic/releases)
* Unzip and open _"magic.sln"_ in Visual Studio
* Click F5

### .NET Core CLI Template

This repository also includes a .NET Core CLI template which can be installed by:

* Clone the repo
* Open a terminal in the parent of the repo
  * i.e. one level above the root of the repo
  * if you cloned to `~/code/magic`, then open the terminal at `~/code/`
* Run the following command: `dotnet new --install magic`

This will install the contents of this repo as a template, which you can use alongside the .NET Core CLI in the following manner:

`dotnet new magic --help`

This will show the list of command line switches which are available, along with descriptions and their default values.

```
Super DRY Magic (C#)
Author: Thomas Hansen
Options:                                                                                      
  -at|--app-title           The title of the application (shown in Swagger)                   
                            string - Optional                                                 
                            Default: Magic                                                    

  -ad|--app-desc            A description of the application (shown in Swagger)               
                            string - Optional                                                 
                            Default: An Affero GPL Licensed starter kit for ASP.NET Core      

  -acn|--app-contact-name   The name of the main developer contact (shown in Swagger)         
                            string - Optional                                                 
                            Default: Thomas Hansen                                            

  -ace|--app-contact-email  The email address of the main developer contact (shown in Swagger)
                            string - Optional                                                 
                            Default: thomas@gaiasoul.com                                      

  -acu|--app-contact-url    The url of the main developer contact (shown in Swagger)          
                            string - Optional                                                 
                            Default: gaiasoul.com                                             

  -ln|--licence-name        The name of the licence for this applicattion (shown in Swagger)  
                            string - Optional                                                 
                            Default: Affero GPL
```

Creating a new instance of the magic code base is as simple as issuing the following command:

`dotnet new magic --name super.dry.magic.application`

After the scaffolding process completes, you will find a copy of the code base in the `./super.dry.magic.application/` directory. The `--name` switch will take care of full namespace replacement, and the optional switches (shown above) will have their default values supplied.

As an example of how to override them, here is the same command but with some of the optional switches provided:

`dotnet new magic --name super.dry.magic.application -acn "Jamie Taylor" -ace "jamie@gaprogman.com" -acu "https://dotnetcore.show"`

This is replace the contents of the following lines in the startup.cs class:

``` csharp
c.SwaggerDoc("v1", new Info
    {
        Title = "TITLE",
        Version = "v1",
        Description = "DESC",
        TermsOfService = "LICENCE",
        Contact = new Contact()
        {
            Name = "MAIN_CONTACT",
            Email = "MAIN_EMAIL",
            Url = "MAIN_URL"
        }
    });
```

With the following:

``` csharp
c.SwaggerDoc("v1", new Info
    {
        Title = "Magic",
        Version = "v1",
        Description = "Some test magic",
        TermsOfService = "Affero GPL",
        Contact = new Contact()
        {
            Name = "Jamie Taylor",
            Email = "jamie@gaprogman.com",
            Url = "https://dotnetcore.show"
        }
    });
```

## Features

Magic supports MySQL, MSSQL and SQLIte out of the box, but adding support for your own relational database type, can be done with three lines
of code. This is possible due to the usage of Fluent nHibernate. Magic relies upon the following projects.

* Fluent nHibernate
* Mapster
* Ninject
* Swashbuckle Swagger UI
* log4net

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

## Licensing, buy me a bottle of Champagne

Magic is licensed as Affero GPL, which implies that you can only use it to create Open Source software - However, a proprietary
enabling license can be obtained for $50 by following [this PayPal link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=W5AG4JZE2TL98) and
pay me $50 dollars - At which point you are free to create _one_ closed source web app. If you want to create multiple closed source web APIs using Magic, you'll
have to purchase one license for each web API project you want to create.

* [Purchase closed source license for $50](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=W5AG4JZE2TL98)

Notice, without a closed source license, your code automatically becomes Open Source, and you'll have to provide a link to your own source code from any website(s),
and/or application(s) from where you are consuming your Magic web API. With a closed source license, you can create closed source code, and you don't have to provide
a link to neither me, nor your own source code.

You might also probably find me slightly more helpful and friendly in case you [require help or support](https://github.com/polterguy/magic/issues),
if you can show me somehow that you have purchased a closed source license - In addition to that you get that warm and fuzzy feeling of having contributed to
my Champagne budget.

> Send more Champagne

Quote by Karl Marx
