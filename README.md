
# Magic; THE Open Source No-Code/Low-Code platform

Magic is a No-Code/Low-Code application generator that allows you to create CRUD apps automatically.
In addition it is a complete Open Source cloud system, allowing you to create your own virtualised
cloud on top of your own server, and/or other cloud systems. Below is a screenshot of its dashboard.

![Dashboard screenshot](https://servergardens.com/wp-content/uploads/2021/08/low-code-screenshot.png)

The way Magic works is by reading meta data from your database, for then to automatically generate a
complete web API for you, and then afterwards create a complete Angular frontend on top of that.
Basically, minutes after you started, you've got thousands of lines of perfect Angular and .Net code,
super scalable, and 100% perfectly secure.

## Features

1. An SQL component allowing you to execute arbitrary SQL and select records through a browser based interface.
2. CRUD generator creating HTTP REST CRUD endpoints automatically wrapping your database of choice.
3. Browsing and invoking your HTTP endpoints, through a UI that is similar to Swagger/SwashBuckle.
4. File explorer allowing you to upload, download, edit and administrate your server's files.
5. Hyper IDE being a Micro IDE for your dynamic files.
6. Sockets administration allowing you to administrate your SignalR socket connections, subscribe to generic messages, and publish messages as you see fit.
7. A browser based Terminal giving you direct access to your server's operating system.
8. REPL evaluator for Hyperlambda allowing you to execute arbitrary Hyperlambda towards your server.
9. Configuration editor, allowing you to edit your server's appsettings.json file directly from within the browser.
10. Audit logging, with the ability to browse your log, including extracting statistics and filtering.
11. Scheduled tasks allowing you to create tasks in Hyperlambda and schedule these as you see fit.
12. Auth component giving you access to administrate your server's users and roles.
13. Crypto menu to administrate cryptography keys, plus a lot of unique features, such as cryptographically signed lambda invocations, with receipts of execution, etc.
14. Health component to see diagnostics about your systems, such as failed login attempt, other security issues, breaking down bugs and errors occurring in the system.
15. ++++

## Video introduction to Magic

You can get a rapid introduction to the system by watching the [following video](https://www.youtube.com/watch?v=1Wmp5QJCnmM).

## Documentation

* [Getting started](https://servergardens.com/get-started/)
* [Full documentation for the system](https://polterguy.github.io/documentation/)

## Services

[ServerGardens.Com](https://servergardens.com/) provides a whole range of services around Magic,
including custom development, hosting, setup, etc. Visit [our website](https://servergardens.com/)
for more information.

## License

**TL;TR** - You can create closed source applications with Magic, but you can _not_ close Magic itself.

The frontend dashboard is licensed under the terms of the GPL version 3, as published by the Free Software Foundation -
While the backend is licensed under the terms of the MIT license. What this implies, is that you can freely use Magic
as you see fit, also in your own proprietary and closed source applications - However, if you modify any of its plugins,
and or the dashboard frontend, you'll have to publish your changes to anyone requesting your changes.

To sum up each license.

* All NuGet packages are LGPL3
* The `backend` folder is MIT
* The `frontend` folder is GPL3

See the enclosed LICENSE files within each folder, and/or plugin if in doubt.

Copyright(c) Thomas Hansen 2019 - 2021, Thomas Hansen - thomas@servergardens.com

* [Magic Documentation](https://polterguy.github.io/)
