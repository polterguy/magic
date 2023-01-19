
# An AI-based Low-Code software development platform

![Build status](https://github.com/polterguy/magic/actions/workflows/codeql-analysis.yml/badge.svg)

Magic is a Low-Code CRUD generator with machine learning and artificial intelligence allowing you to
generate most of your code 100% automatically. In addition it is a complete open source cloud platform
and IDE, allowing you to create your own virtualized cloud on top of your own server, and/or other
cloud systems. Magic is professionally maintained by [Aista](https://aista.com).
Below is a screenshot of an app built in 5 minutes using our [Low-Code CRUD generator](https://aista.com/crud-datagrid/).
Try the app [here](https://sakila.aista.com).

![Low-Code CRUD generator](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/sakila.jpg)

Magic works by reading meta data from your database, for then to automatically generate a
backend API for you. The resulting API is secured automatically, and Magic takes care
of authentication, authorisation, user management, and everything else that's difficult. Afterwards you can
optionally generate a datagrid giving you a full stack web app as the screenshot above illustrates.
Every time you have some complex task, you can ask the integrated AI assistant in plain English
to show you the code required to solve your problem.

## Use AI to create software

Magic integrates AI and machine learning where ever it makes sense. In Hyper IDE you can for instance
simply ask the machine in plain English what you want to achieve, and most of the time the AI integration
will automatically generate the correct code for you automatically. This works with any programming
language, including Hyperlambda.

![Use AI to produce software](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-hyper-ide.jpeg)

## Create your own Machine Learning model

Magic allows you to generate your own Machine Learning model(s) by creating and importing
training data from any source you might have, including scraping your website. This allows you to generate
a custom AI model based upon whatever existing data you may have in seconds instead of weeks and months.

![Use AI to produce software](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/crawl-website-for-chatgpt-training-data.jpg)

This is the method we use ourselves to teach our Machine Learning models about Aista and Hyperlambda
in fact. Use cases for this could include.

* AI models for lawyer firms answering questions about local law
* AI models for the medical industry, diagnosing and providing answers about symptoms
* News aggregating AI machine models answering questions about recent news related to some news website
* Invetment advice AI models providing investment advice to people asking questions about somespecific investment instrument
* Etc, etc, etc

## Use SQL Studio to design your database

Magic also gives you SQL Studio, allowing you to visually design your database, even if you have zero
SQL knowledge. You can use SQL studio to design your SQL Server database, PostgreSQL database, MySQL database,
or SQLite database. You can also connect to your existing database to manage your existing database from SQL Studio.

![Visually design your database using SQL Studio](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/sql-studio-new.jpeg)

## CRUD API generator

Magic allows you to automagically generate a secure CRUD API wrapping any database. The API generator
supports Microsoft SQL Server, PostgreSQL, MySQL and SQLite. Point Magic to your database, click a button,
and some few seconds later you've got a CRUD API wrapping every single table in your database. The
CRUD API is generated as Hyperlambda endpoints, allowing you to edit and modify the code after generating
your API, to add custom business logic to your endpoints as you see fit.

![CRUD API generator](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/crud-generator-new.jpeg)


## Useful links

* [Create a Low-Code CRUD app in seconds](https://aista.com)
* [CRUD API generator](https://aista.com/crud-api-generator/)
* [How magic creates full stack web apps](https://aista.com/crud-datagrid/)
* [SQL Studio to visually design your database](https://aista.com/sql-studio/)
* [SQL API generator](https://aista.com/sql-api-generator/)
* [What is Hyperlambda](https://aista.com/hyperlambda/)
* [Hyperlambda 101](https://aista.com/hyperlambda-101/)
* [AI based software development](https://aista.com/blog/ai-based-software-development/)

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

Copyright(c) Aista, Ltd 2019 - 2023, info@aista.com
