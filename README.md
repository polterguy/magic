
# Magic for ASP.NET

Magic is a super extendible DSL and a scaffolding CRUD generator for .Net Core, that allows you to create your
.Net Core/Angular/Database Web applications, _literally by simply clicking a button_. Watch the video below for a demonstration.

<p align="center">
<a href="https://www.youtube.com/watch?v=afzxchk82nY">
<img alt="Create a CRUD Web app in seconds" title="Create a CRUD Web app in seconds" src="https://servergardens.files.wordpress.com/2021/01/youtube-video.png" />
</a>
</p>

## Getting started

The simplest way to get started, is to [download its latest release](https://github.com/polterguy/magic/releases),
and use it as a _"starter kit"_. You will need.

1. [.Net 5 CLI and SDK](https://dotnet.microsoft.com/download)
2. Some sort of database server [MySql](https://dev.mysql.com/downloads/mysql/) or [MS SQL](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express)
3. [NodeJS](https://nodejs.org/en/download/), required to serve Angular frontend
4. Install [Angular](https://angular.io/guide/setup-local) in a terminal window with `npm install -g @angular/cli`
5. [Magic](https://github.com/polterguy/magic/releases)

To start the Magic dashboard type `dotnet run` in the _"backend"_ folder. Then type `npm link` in your
_"frontend"_ folder. Start the Magic dashboard by typing `ng serve` in the _"frontend"_ folder. then go to
[http://localhost:4200](http://localhost:4200) with your browser.

## Documentation

You can find [the project's documentation here](https://polterguy.github.io).

## License

Although most of Magic's source code is Open Source, you will need a license key to use it.
[You can obtain a license key here](https://servergardens.com/buy/).
Notice, 47 hours after you put Magic into production, it will stop working, unless you have a valid
license.

* [Get licensed](https://servergardens.com/buy/)

Copyright(c) Thomas Hansen 2019 - 2021, Thomas Hansen - thomas@servergardens.com
