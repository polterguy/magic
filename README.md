
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

1. [.Net Core CLI](https://dotnet.microsoft.com/download) version 3.1.300 or more
2. Some sort of database server [MySql](https://dev.mysql.com/downloads/mysql/) or [MS SQL](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express)
3. [NodeJS](https://nodejs.org/en/download/), required to serve Angular frontend
4. Install [Angular](https://angular.io/guide/setup-local) in a terminal window with `npm install -g @angular/cli`
5. [Magic](https://github.com/polterguy/magic/releases)

To start the Magic dashboard type `dotnet run` in the _"backend"_ folder. Then type `npm link` in your
_"frontend"_ folder. Start the Magic dashboard by typing `ng serve` in the _"frontend"_ folder. then go to
[http://localhost:4200](http://localhost:4200) with your browser.

## Documentation and Build Status

You can rapidly [teach yourself the basics here](https://polterguy.github.io). The reference documentation you can find further down
on this page, together with the current build status, and quality gates for the project(s).

### Extending Hyperlambda

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

### Quality gates and reference documentation

* Magic, this page
  - [![Build status](https://travis-ci.com/polterguy/magic.svg?master)](https://travis-ci.com/polterguy/magic)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic)
* [Magic Node](https://github.com/polterguy/magic.node) - Explains nodes, Hyperlambda and Expressions
  - [![Build status](https://travis-ci.com/polterguy/magic.node.svg?master)](https://travis-ci.com/polterguy/magic.node)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.node&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.node)
* [Magic Library](https://github.com/polterguy/magic.library) - Explains how magic is tied together with ASP.NET
  - [![Build status](https://travis-ci.com/polterguy/magic.library.svg?master)](https://travis-ci.com/polterguy/magic.library)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.library&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.library)
* [Magic Lambda Auth](https://github.com/polterguy/magic.lambda.auth) - Authentication and authorisation from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.auth.svg?master)](https://travis-ci.com/polterguy/magic.lambda.auth)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.auth&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.auth)
* [Magic Lambda Validators](https://github.com/polterguy/magic.lambda.validators) - Validate input in Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.validators.svg?master)](https://travis-ci.com/polterguy/magic.lambda.validators)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.validators&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.validators)
* [Magic Lambda Strings](https://github.com/polterguy/magic.lambda.strings) - Manipulate strings in Hyperlambda
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.strings.svg?master)](https://travis-ci.com/polterguy/magic.lambda.strings)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.strings&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.strings)
* [Magic Lambda Dates](https://github.com/polterguy/magic.lambda.dates) - Allows you to manipulate DateTime objects.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.dates.svg?master)](https://travis-ci.com/polterguy/magic.lambda.dates)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.dates&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.dates)
* [Magic Lambda Slots](https://github.com/polterguy/magic.lambda.slots) - Dynamically create your own slots/functions
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.slots.svg?master)](https://travis-ci.com/polterguy/magic.lambda.slots)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.slots&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.slots)
* [Magic Lambda MySQL](https://github.com/polterguy/magic.lambda.mysql) - Accessing your MySQL server from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.mysql.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mysql)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mysql&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mysql)
* [Magic Lambda MS SQL](https://github.com/polterguy/magic.lambda.mssql) - Accessing your MS SQL Server from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.mssql.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mssql)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mssql&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mssql)
* [Magic Lambda Math](https://github.com/polterguy/magic.lambda.math) - Math operations from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.math.svg?master)](https://travis-ci.com/polterguy/magic.lambda.math)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.math&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.math)
* [Magic Lambda Logging](https://github.com/polterguy/magic.lambda.logging) - Logging from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.logging.svg?master)](https://travis-ci.com/polterguy/magic.lambda.logging)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.logging&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.logging)
* [Magic Lambda Caching](https://github.com/polterguy/magic.lambda.caching) - Caching from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.caching.svg?master)](https://travis-ci.com/polterguy/magic.lambda.caching)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.caching&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.caching)
* [Magic Lambda JSON](https://github.com/polterguy/magic.lambda.json) - Manipulating JSON from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.json.svg?master)](https://travis-ci.com/polterguy/magic.lambda.json)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.json&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.json)
* [Magic Lambda Mail](https://github.com/polterguy/magic.lambda.mail) - Sending and retrieving emails from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.mail.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mail)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda,mail)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mail&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mail)
* [Magic Lambda MIME](https://github.com/polterguy/magic.lambda.mime) - Parsing email messages in Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.mime.svg?master)](https://travis-ci.com/polterguy/magic.lambda.mime)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.mime&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.mime)
* [Magic Lambda IO](https://github.com/polterguy/magic.lambda.io) - File manipulation using Hyperlambda
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.io.svg?master)](https://travis-ci.com/polterguy/magic.lambda.io)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
* [Magic Lambda Hyperlambda](https://github.com/polterguy/magic.lambda.hyperlambda) - Parse Hyperlambda from text, and vice versa.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.hyperlambda.svg?master)](https://travis-ci.com/polterguy/magic.lambda.hyperlambda)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.hyperlambda&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.hyperlambda)
* [Magic Lambda HTTP](https://github.com/polterguy/magic.lambda.http) - Invoking HTTP REST endpoints from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.http.svg?master)](https://travis-ci.com/polterguy/magic.lambda.http)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.http&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.http)
* [Magic Lambda Crypto](https://github.com/polterguy/magic.lambda.crypto) - Cryptography helpers in Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.crypto.svg?master)](https://travis-ci.com/polterguy/magic.lambda.crypto)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.crypto&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.crypto)
* [Magic Lambda Config](https://github.com/polterguy/magic.lambda.config) - Accessing configuration values from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.config.svg?master)](https://travis-ci.com/polterguy/magic.lambda.config)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.config&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.config)
* [Magic Lambda](https://github.com/polterguy/magic.lambda) - Explains all _"keywords"_ in Hyperlambda
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.svg?master)](https://travis-ci.com/polterguy/magic.lambda)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda)
* [Magic Lambda Scheduler](https://github.com/polterguy/magic.lambda.scheduler) - Scheduled tasks from Hyperlambda.
  - [![Build status](https://travis-ci.com/polterguy/magic.lambda.scheduler.svg?master)](https://travis-ci.com/polterguy/magic.lambda.scheduler)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.scheduler&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.scheduler)
* [Magic IO](https://github.com/polterguy/magic.io) - IO operations in Magic.
  - [![Build status](https://travis-ci.com/polterguy/magic.io.svg?master)](https://travis-ci.com/polterguy/magic.io)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.lambda.io&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.lambda.io)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.io&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.io)
* [Magic HTTP](https://github.com/polterguy/magic.http) - HTTP rest in Magic
  - [![Build status](https://travis-ci.com/polterguy/magic.http.svg?master)](https://travis-ci.com/polterguy/magic.http)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.http)
* [Magic Endpoint](https://github.com/polterguy/magic.endpoint) - Endpoint resolving in Magic
  - [![Build status](https://travis-ci.com/polterguy/magic.endpoint.svg?master)](https://travis-ci.com/polterguy/magic.endpoint)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.endpoint&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.http&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.endpoint)
* [Magic Data Common](https://github.com/polterguy/magic.data.common) - Commonalities for data adapters in Magic.
  - [![Build status](https://travis-ci.com/polterguy/magic.data.common.svg?master)](https://travis-ci.com/polterguy/magic.data.common)
  - [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=alert_status)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=bugs)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=code_smells)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=coverage)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=ncloc)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=security_rating)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)
  - [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=polterguy_magic.data.common&metric=sqale_index)](https://sonarcloud.io/dashboard?id=polterguy_magic.data.common)

## License

Although most of Magic's source code is Open Source, you will need a license key to use it.
[You can obtain a license key here](https://servergardens.com/buy/).
Notice, 7 days after you put Magic into production, it will stop working, unless you have a valid
license for it.

* [Get licensed](https://servergardens.com/buy/)

Copyright(c) Thomas Hansen 2019 - 2020, Thomas Hansen - thomas@servergardens.com
