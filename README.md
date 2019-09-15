
# Magic for ASP.NET Core

[![Build status](https://travis-ci.org/polterguy/magic.svg?master)](https://travis-ci.org/polterguy/magic)

Magic is a starter kit for super dynamic and super DRY ASP.NET Core web API applications. Among other things, it allows you
to _"declare"_ a web API endpoint, with a handful of Hyperlambda lines of code, 100% automatically. Hyperlambda is kind of
like YAML, only significantly simpler in its syntax. Your Hyperlambda is again invoking C# methods, using a Super Signal
design pattern, allowing you to make solutions that are unimaginably loosely coupled together, resulting in super dynamic
and flexible web APIs. Basically, create a CRUD app, wrapping your database, by simply clicking a button.

<p align="center">
<a href="https://www.youtube.com/watch?v=4TyT4lBEOg8">
<img alt="Create a Magic CRUD app in seconds" title="Create a Magic CRUD app in seconds" src="https://phosphorusfive.files.wordpress.com/2019/09/create-a-magic-crud-app-in-seconds.png" />
</a>
</p>

It was build by leveraging the ideas written about in the following MSDN article to the extreme. However, the library has been completely
changed since the article was written, and improved to become unrecognizable due to chasing these same ideas further and further down
the rabbit hole.

* [Super DRY Magic for ASP.NET Core](https://msdn.microsoft.com/en-us/magazine/mt833461)

The above article is written by me, the developer behind Magic. In addition I also wrote the 5th most read article
for MSDN Magazine about [Hyperlambda, making C# more dynamic](https://msdn.microsoft.com/magazine/mt809119).
Although the article is a bit dated today, it explains some of the techniques that has been applied
when creating Magic.

## License

Magic is licensed as Affero GPL. This means that you can only use it to create Open Source solutions.
If this is a problem, you can contact at thomas@gaiasoul.com me to negotiate a proprietary license if
you want to use the framework to build closed source code. This will allow you to use Magic in closed
source projects, in addition to giving you access to Microsoft SQL Server adapters, to _"crudify"_
database tables in MS SQL Server. I also provide professional support for clients that buys a
proprietary enabling license.

## Notice

If you are looking for the version of Magic that the Super DRY MSDN article describes, you can 
[find it here](https://github.com/polterguy/magic/releases/tag/v3.0). This is the last release of that
codebase though, and I intend to completely change the library to exclusively be built around Hyperlambda
for all future releases.
