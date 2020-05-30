
# Magic for ASP.NET

Magic is a scaffolding CRUD generator for .Net Core that allows you to create your .Net Core/Angular/Database Web
applications by simply clicking a button. Watch the video below for a demonstration.

<p align="center">
<a href="https://www.youtube.com/watch?v=8xO9H-2Fejc">
<img alt="Create a CRUD Web app in seconds" title="Create a CRUD Web app in seconds" src="https://servergardens.files.wordpress.com/2020/01/magic-video-screenshot.png" />
</a>
</p>

## Getting started

The simplest way to get started, is to [download its latest release](https://github.com/polterguy/magic/releases),
and use it as a _"starter kit"_. You will need.

1. [.Net Core CLI](https://dotnet.microsoft.com/download) version 3.x or more
2. Some sort of database server [Mysql](https://dev.mysql.com/downloads/mysql/) or [MS SQL](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express)
3. [NodeJS](https://nodejs.org/en/download/)
4. Install [Angular](https://angular.io/guide/setup-local) in a terminal window with `npm install -g @angular/cli`
5. [Magic](https://github.com/polterguy/magic/releases)

To start the Magic dashboard type `dotnet run` in the _"magic.backend"_ folder. Then type `npm link` in your
_"frontend"_ folder. Start the Magic dashboard by typing `ng serve` in the _"frontend"_ folder. Go to
[http://localhost:4200](http://localhost:4200).

## Documentation

You can rapidly [teach yourself the basics here](https://polterguy.github.io).
Below you can find the reference documentation for all projects in Magic.

### Hyperlambda, Super Signals and Slots

These are probably the most important parts if you intend to develop in Hyperlambda.

* [Magic Node](https://github.com/polterguy/magic.node) - Explains nodes, Hyperlambda and Expressions
* [Magic Lambda](https://github.com/polterguy/magic.lambda) - Explains all _"keywords"_ in Hyperlambda
* [Magic Lambda Math](https://github.com/polterguy/magic.lambda.math) - Math operations from Hyperlambda, such as add, subtract, etc.
* [Magic Lambda Slots](https://github.com/polterguy/magic.lambda.slots) - Dynamically create your own slots (Hyperlambda functions)
* [Magic Lambda Strings](https://github.com/polterguy/magic.lambda.strings) - Manipulate strings in Hyperlambda
* [Magic Lambda IO](https://github.com/polterguy/magic.lambda.io) - File manipulation using Hyperlambda
* [Magic Lambda HTTP](https://github.com/polterguy/magic.lambda.http) - Invoking HTTP REST endpoints from Hyperlambda.
* [Magic Lambda MS SQL](https://github.com/polterguy/magic.lambda.mssql) - Accessing your MS SQL Server from Hyperlambda.
* [Magic Lambda MySQL](https://github.com/polterguy/magic.lambda.mysql) - Accessing your MySQL server from Hyperlambda.
* [Magic Lambda Mail](https://github.com/polterguy/magic.lambda.mail) - Sending and retrieving emails from Hyperlambda.
* [Magic Lambda MIME](https://github.com/polterguy/magic.lambda.mime) - Parsing email messages in Hyperlambda.
* [Magic Lambda JSON](https://github.com/polterguy/magic.lambda.json) - Manipulating JSON from Hyperlambda.
* [Magic Lambda Config](https://github.com/polterguy/magic.lambda.config) - Accessing configuration values from Hyperlambda.
* [Magic Lambda Logging](https://github.com/polterguy/magic.lambda.logging) - Logging from Hyperlambda.
* [Magic Lambda Auth](https://github.com/polterguy/magic.lambda) - Doing basic authentication and authorisation from Hyperlambda.
* [Magic Lambda Crypto](https://github.com/polterguy/magic.lambda.crypto) - Cryptography helpers in Hyperlambda.
* [Magic Lambda Scheduler](https://github.com/polterguy/magic.lambda.scheduler) - Scheduled tasks from Hyperlambda.
* [Magic Lambda Hyperlambda](https://github.com/polterguy/magic.lambda.hyperlambda) - Parse Hyperlambda from text, and vice versa.
* [Magic Lambda Validators](https://github.com/polterguy/magic.lambda.validators) - Validate input in Hyperlambda.

### Supporting libraries

* [Magic IO](https://github.com/polterguy/magic.io)
* [Magic HTTP](https://github.com/polterguy/magic.http)
* [Magic Library](https://github.com/polterguy/magic.library)
* [Magic Endpoint](https://github.com/polterguy/magic.endpoint)
* [Magic Data Common](https://github.com/polterguy/magic.data.common)

## License

Although most of Magic's source code is publicly available, Magic is _not_ Open Source or Free Software.
You have to obtain a valid license key to install it in production, and I normally charge a fee for such a
key. You can [obtain a license key here](https://servergardens.com/buy/).
Notice, 5 hours after you put Magic into production, it will stop working, unless you have a valid
license for it.

* [Get licensed](https://servergardens.com/buy/)

Copyright(c) Thomas Hansen 2019 - 2020, Thomas Hansen - thomas@servergardens.com

## Build status

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
