
# Magic for ASP.NET

[![Build status](https://travis-ci.org/polterguy/magic.svg?master)](https://travis-ci.org/polterguy/magic)

Magic is a CRUD app generator, allowing you to create CRUD Web APIs on top of ASP.NET Core.
In 1 minute, you can basically create hundreds of HTTP REST based CRUD Web API endpoints,
wrapping your entire database, even if it has hundreds of tables. It feels almost like Magic,
allowing you to build secure CRUD Web API endpoints in seconds, hence its name. Watch the video
below for a demonstration of the system.

<p align="center">
<a href="https://www.youtube.com/watch?v=4TyT4lBEOg8">
<img alt="Create a Magic CRUD app in seconds" title="Create a Magic CRUD app in seconds" src="https://phosphorusfive.files.wordpress.com/2019/09/create-a-magic-crud-app-in-seconds.png" />
</a>
</p>

Magic was built by leveraging the ideas written about in the following MSDN article to the extreme. However, the library has been completely
changed since the article was written, and improved to become unrecognizable due to chasing these same ideas further and further down
the rabbit hole.

* [Super DRY Magic for ASP.NET Core](https://msdn.microsoft.com/en-us/magazine/mt833461)

The above article is written by me, the developer behind Magic. In addition I also wrote the 5th most read article
for MSDN Magazine about [Hyperlambda, making C# more dynamic](https://msdn.microsoft.com/magazine/mt809119).
Although the article is a bit dated today, it explains some of the techniques that has been applied
when creating Magic.

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
in all references to all modules in Magic, since Magic is extremely modularized in its architecture.

## License

Although most of Magic's source code is publicly available, Magic is _not_ Open Source or Free Software.
You have to obtain a valid license key to install it in production, and I normally charge a fee for such a
key. You can [obtain a license key here](https://gaiasoul.com/license-magic/).
Notice, 5 hours after you put Magic into production, it will stop functioning, unless you have a valid
license for it.

* [Get licensed](https://gaiasoul.com/license-magic/)
