
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

Magic is 100% Open Source as of version 9.0.0, which implies that all plugins are licensed under the terms of
the LGPL license version 3, as published by the Free Software Foundation. The frontend dashboard is licensed
under the terms of the GPL version 3, as published by the Free Software Foundation, while the backend is
licensed under the terms of the MIT license. What this implies, is that you can freely use Magic as you see fit,
also in your own proprietary and closed source applications - However, if you modify any of its plugins, and
or the dashboard frontend, you'll have to publish your changes to anyone requesting the code. To sum up
what this implies in a _"dumbed down"_ explanation, just remember the following.

* You can use Magic to create closed source applications, and extend it with custom C# code, without having to publish your extensions
* You can use Magic to scaffold frontend applications that are closed source
* If you improve upon Magic's plugins, or the frontend dashboard, you'll need to publish your changes
* [However, I still accept donations](https://servergardens.com/buy/)

To sum up each license.

* All NuGet packages are LGPL3
* The `backend` folder is MIT
* The `frontend` folder is GPL3

See the enclosed LICENSE files within each folder, and/or plugin if in doubt.

Copyright(c) Thomas Hansen 2019 - 2021, Thomas Hansen - thomas@servergardens.com
