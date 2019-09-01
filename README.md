
# Magic for ASP.NET Core

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

The article is written by the author of Magic.

## License

Magic is licensed as Affero GPL. If this is a problem, you can contact at thomas@gaiasoul.com me to negotiate a proprietary license if
you want to use the framework to build closed source code.

## Notice

After refactoring Magic to use Hyperlambda, the library has not yet been completely stabilized and should be considered BETA
software at the moment - At least until I manage to create a release of its current codebase. If you are looking for the
version of Magic that the MSDN article describes, you can [find it here](https://github.com/polterguy/magic/releases/tag/v3.0).
This is the last release of that codebase though, and I intend to completely change the library to exclusively be built around
Hyperlambda for all future releases.
