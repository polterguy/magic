
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
2. Some sort of database server [MySql](https://dev.mysql.com/downloads/mysql/) or [MS SQL](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express)
3. [NodeJS](https://nodejs.org/en/download/)
4. Install [Angular](https://angular.io/guide/setup-local) in a terminal window with `npm install -g @angular/cli`
5. [Magic](https://github.com/polterguy/magic/releases)

To start the Magic dashboard type `dotnet run` in the _"backend"_ folder. Then type `npm link` in your
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
* [Magic Lambda Caching](https://github.com/polterguy/magic.lambda.caching) - Caching from Hyperlambda.
* [Magic Lambda Auth](https://github.com/polterguy/magic.lambda.auth) - Basic authentication and authorisation from Hyperlambda.
* [Magic Lambda Crypto](https://github.com/polterguy/magic.lambda.crypto) - Cryptography helpers in Hyperlambda.
* [Magic Lambda Scheduler](https://github.com/polterguy/magic.lambda.scheduler) - Scheduled tasks from Hyperlambda.
* [Magic Lambda Hyperlambda](https://github.com/polterguy/magic.lambda.hyperlambda) - Parse Hyperlambda from text, and vice versa.
* [Magic Lambda Validators](https://github.com/polterguy/magic.lambda.validators) - Validate input in Hyperlambda.
* [Magic Lambda Dates](https://github.com/polterguy/magic.lambda.dates) - Allows you to manipulate DateTime objects.

#### Extending Hyperlambda

You can easily extend Hyperlambda with your own _"keywords"_ - Or _"slots"_ to be specifically. This is done by
implementing the `ISlot` interface on your class, and adding an attribute to it as follows.

```csharp
using magic.node;
using magic.signals.contracts;

namespace acme.foo
{
    [Slot(Name = "acme.foo")]
    public class Foo : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "Hello World";
        }
    }
}
```

The above will result in a slot you can invoke from Hyperlambda using the following code.

```
acme.foo
```

### Supporting libraries

* [Magic IO](https://github.com/polterguy/magic.io)
* [Magic HTTP](https://github.com/polterguy/magic.http)
* [Magic Library](https://github.com/polterguy/magic.library)
* [Magic Endpoint](https://github.com/polterguy/magic.endpoint)
* [Magic Data Common](https://github.com/polterguy/magic.data.common)

## License

Although most of Magic's source code is Open Source, you will need a license key to use it.
[You can obtain a license key here](https://servergardens.com/buy/).
Notice, 7 days after you put Magic into production, it will stop working, unless you have a valid
license for it.

* [Get licensed](https://servergardens.com/buy/)

Copyright(c) Thomas Hansen 2019 - 2020, Thomas Hansen - thomas@servergardens.com

## Build status

[![Build status](https://travis-ci.com/polterguy/magic.svg?master)](https://travis-ci.com/polterguy/magic)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic) - Magic

[![Build status](https://travis-ci.com/polterguy/magic.node.svg?master)](https://travis-ci.com/polterguy/magic.node)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.node) - Magic Node

[![Build status](https://travis-ci.com/polterguy/magic.library.svg?master)](https://travis-ci.com/polterguy/magic.library)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.library) - Magic Library

[![Build status](https://travis-ci.com/polterguy/magic.lambda.auth.svg?master)](https://travis-ci.com/polterguy/magic.lambda.auth)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth) - Magic Lambda Auth

[![Build status](https://travis-ci.com/polterguy/magic.lambda.validators.svg?master)](https://travis-ci.com/polterguy/magic.lambda.validators)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators) - Magic Lambda Validators

[![Build status](https://travis-ci.com/polterguy/magic.lambda.strings.svg?master)](https://travis-ci.com/polterguy/magic.lambda.strings)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings) - Magic Lambda Strings

[![Build status](https://travis-ci.com/polterguy/magic.lambda.dates.svg?master)](https://travis-ci.com/polterguy/magic.lambda.dates)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates) - Magic Lambda Dates

[![Build status](https://travis-ci.com/polterguy/magic.lambda.slots.svg?master)](https://travis-ci.com/polterguy/magic.lambda.slots)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots) - Magic Lambda Slots

[![Build status](https://travis-ci.com/polterguy/magic.lambda.mysql.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mysql)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql) - Magic Lambda MySQL

[![Build status](https://travis-ci.com/polterguy/magic.lambda.mssql.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mssql)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql) - Magic Lambda MS SQL

[![Build status](https://travis-ci.com/polterguy/magic.lambda.math.svg?master)](https://travis-ci.com/polterguy/magic.lambda.math)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math) - Magic Lambda Math

[![Build status](https://travis-ci.com/polterguy/magic.lambda.logging.svg?master)](https://travis-ci.com/polterguy/magic.lambda.logging)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging) - Magic Lambda Logging

[![Build status](https://travis-ci.com/polterguy/magic.lambda.caching.svg?master)](https://travis-ci.com/polterguy/magic.lambda.caching)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching) - Magic Lambda Caching

[![Build status](https://travis-ci.com/polterguy/magic.lambda.json.svg?master)](https://travis-ci.com/polterguy/magic.lambda.json)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json) - Magic Lambda JSON

[![Build status](https://travis-ci.com/polterguy/magic.lambda.mail.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mail)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda,mail) - Magic Lambda Mail

[![Build status](https://travis-ci.com/polterguy/magic.lambda.mime.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mime)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime) - Magic Lambda MIME

[![Build status](https://travis-ci.com/polterguy/magic.lambda.io.svg?master)](https://travis-ci.com/polterguy/magic.lambda.io)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io) - Magic Lambda IO

[![Build status](https://travis-ci.com/polterguy/magic.lambda.hyperlambda.svg?master)](https://travis-ci.com/polterguy/magic.lambda.hyperlambda)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda) - Magic Lambda Hyperlambda

[![Build status](https://travis-ci.com/polterguy/magic.lambda.http.svg?master)](https://travis-ci.com/polterguy/magic.lambda.http)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http) - Magic Lambda HTTP

[![Build status](https://travis-ci.com/polterguy/magic.lambda.crypto.svg?master)](https://travis-ci.com/polterguy/magic.lambda.crypto)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto) - Magic Lambda Crypto

[![Build status](https://travis-ci.com/polterguy/magic.lambda.config.svg?master)](https://travis-ci.com/polterguy/magic.lambda.config)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config) - Magic Lambda Config

[![Build status](https://travis-ci.com/polterguy/magic.lambda.svg?master)](https://travis-ci.com/polterguy/magic.lambda)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda) - Magic Lambda

[![Build status](https://travis-ci.com/polterguy/magic.lambda.scheduler.svg?master)](https://travis-ci.com/polterguy/magic.lambda.scheduler)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler) - Magic Lambda Scheduler

[![Build status](https://travis-ci.com/polterguy/magic.io.svg?master)](https://travis-ci.com/polterguy/magic.io)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.io) - Magic IO

[![Build status](https://travis-ci.com/polterguy/magic.http.svg?master)](https://travis-ci.com/polterguy/magic.http)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.http) - Magic HTTP

[![Build status](https://travis-ci.com/polterguy/magic.endpoint.svg?master)](https://travis-ci.com/polterguy/magic.endpoint)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint) - Magic Endpoint

[![Build status](https://travis-ci.com/polterguy/magic.data.common.svg?master)](https://travis-ci.com/polterguy/magic.data.common)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common) - Magic Data Common
