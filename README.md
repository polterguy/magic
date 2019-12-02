
# Magic for ASP.NET

[![Build status](https://travis-ci.org/polterguy/magic.svg?master)](https://travis-ci.org/polterguy/magic)
[![Build status](https://travis-ci.org/polterguy/magic.node.svg?master)](https://travis-ci.org/polterguy/magic.node)
[![Build status](https://travis-ci.org/polterguy/magic.library.svg?master)](https://travis-ci.org/polterguy/magic.library)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.auth.svg?master)](https://travis-ci.org/polterguy/magic.lambda.auth)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.strings.svg?master)](https://travis-ci.org/polterguy/magic.lambda.strings)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.slots.svg?master)](https://travis-ci.org/polterguy/magic.lambda.slots)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.mysql.svg?master)](https://travis-ci.org/polterguy/magic.lambda.mysql)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.mssql.svg?master)](https://travis-ci.org/polterguy/magic.lambda.mssql)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.math.svg?master)](https://travis-ci.org/polterguy/magic.lambda.math)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.logging.svg?master)](https://travis-ci.org/polterguy/magic.lambda.logging)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.json.svg?master)](https://travis-ci.org/polterguy/magic.lambda.json)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.io.svg?master)](https://travis-ci.org/polterguy/magic.lambda.io)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.hyperlambda.svg?master)](https://travis-ci.org/polterguy/magic.lambda.hyperlambda)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.http.svg?master)](https://travis-ci.org/polterguy/magic.lambda.http)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.crypto.svg?master)](https://travis-ci.org/polterguy/magic.lambda.crypto)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.config.svg?master)](https://travis-ci.org/polterguy/magic.lambda.config)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.auth.svg?master)](https://travis-ci.org/polterguy/magic.lambda.auth)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.svg?master)](https://travis-ci.org/polterguy/magic.lambda)
[![Build status](https://travis-ci.org/polterguy/magic.lambda.scheduler.svg?master)](https://travis-ci.org/polterguy/magic.lambda.scheduler)
[![Build status](https://travis-ci.org/polterguy/magic.io.svg?master)](https://travis-ci.org/polterguy/magic.io)
[![Build status](https://travis-ci.org/polterguy/magic.http.svg?master)](https://travis-ci.org/polterguy/magic.http)
[![Build status](https://travis-ci.org/polterguy/magic.endpoint.svg?master)](https://travis-ci.org/polterguy/magic.endpoint)
[![Build status](https://travis-ci.org/polterguy/magic.data.common.svg?master)](https://travis-ci.org/polterguy/magic.data.common)

Magic is an automation tool for ASP.NET Core. It features a CRUD app generator, allowing you to create CRUD Web
APIs by simply clicking a button - In addition to a task scheduler, allowing you to schedule tasks for execution
in the future. Watch the video below for a demonstration of Magic's CRUD API generator.

<p align="center">
<a href="https://www.youtube.com/watch?v=4TyT4lBEOg8">
<img alt="Create a Magic CRUD app in seconds" title="Create a Magic CRUD app in seconds" src="https://phosphorusfive.files.wordpress.com/2019/09/create-a-magic-crud-app-in-seconds.png" />
</a>
</p>

Or watch the following video for a demonstration of Magic's task scheduler.

<p align="center">
<a href="https://www.youtube.com/watch?v=I8iNg1wxRSo">
<img alt="Scheduling tasks in ASP.NET Core" title="Scheduling tasks in ASP.NET Core" src="https://servergardens.files.wordpress.com/2019/12/magic-scheduler-screenshot.png" />
</a>
</p>

## Getting started

The simplest way to get started, is to [download its latest release](https://github.com/polterguy/magic/releases),
and use it as a _"starter kit"_. However, if you want to use Magic in an existing project, you could also install the
latest _"magic.library"_ NuGet package, using something resembling the following.

```
Install-Package magic.library
```

**Notice**, you'd still need to make sure you have the contents of the _"files/"_ folder in your own system. This is
because the files folder contains crucial Hyperlambda endpoints, required to have the _"crudifier"_ work.
If the choices I have done in the magic.library is not adequate for your needs, you can also
[download the latest magic.library](https://github.com/polterguy/magic.library/releases) codebase,
and modify it according to your needs. The magic.library project is just a helper to automagically pull
in all references to all modules in Magic, since Magic is extremely modularized in its architecture, and
actually not one project, but in fact more than 20 different components.

## Documentation

Although documentation is work in progress, you can rapidly [teach yourself the basics here](https://polterguy.github.io).

* [Main documentation website](https://polterguy.github.io)
* [Component documentation](https://github.com/polterguy/magic/blob/master/components.md)

## License

Although most of Magic's source code is publicly available, Magic is _not_ Open Source or Free Software.
You have to obtain a valid license key to install it in production, and I normally charge a fee for such a
key. You can [obtain a license key here](https://gaiasoul.com/license-magic/).
Notice, 5 hours after you put Magic into production, it will stop functioning, unless you have a valid
license for it.

* [Get licensed](https://servergardens.com/buy/)
