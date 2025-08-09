
# Where the Machine Creates the Code!

Magic Cloud is a software development automation platform created and maintained by [AINIRO.IO](https://ainiro.io) based upon AI, Low-Code, and No-Code. It's based upon [Hyperlambda](https://docs.ainiro.io/hyperlambda/), allowing you to dynamically create and orchestrate code, using meta programming and generative AI. Below is the Magic dashboard allowing you to automate most of the system using the built in AI agent.

![Vibe Coding with Magic](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/magic-vibe-coding-dashboard.png)

## CRUD generator

In addition to its generative AI capabilities, Magic also comes with a CRUD generator, allowing you to point it at your database, click a button, and wrap all your tables into CRUD endpoints. Combined with its AI capabilities, this can sometimes save you 90% of your time when delivering backend APIs. Magic is built on top of .Net 9 and Angular.

![CRUD generator](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/backend-crud.jpg)

## No-Code AI

Magic contains its own LLM that allows for generating Hyperlambda (backend) code using natural language. Combined with meta programming, this almost entirely eliminates the need to understand code and software development, yet still making it possible to create fairly complex systems using _"vibe coding"_, such as for instance [AI agents](https://ainiro.io/ai-agents) with function calling, and custom ChatGPT _"clones"_ using the [AI Expert System](https://ainiro.io/ai-expert-system).

The concept is you provide a comment and description for what your Hyperlambda file should do. Then you click generate, and the LLM will automatically create code encapsulating your use case. Afterwards you can modify the code as you need. To pull this through, we actually fine tuned and created our own LLM model based upon OpenAI's gpt-4.1-mini, which makes it extremely cost effective and fast.

![AI code generator](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-generated-code.png)

## Hyperlambda

Hyperlambda is a _"5th generation programming language"_, that is on average 10 to 50 times less verbose than traditional languages such as C#, Java, Python, GoLang, and PHP. On average it can solve most problems with 5% of the codebase compared to any traditional programming language. This makes it an extremely high level programming language, allowing you to work declaratively instead of having to implement everything imperatively. Below is a simple HTTP CRUD Read endpoint implemented in C# and Hyperlambda to illustrate what effects this might have on your codebase.

![Hyperlambda versus C#](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/csharp-versus-hyperlambda.png)

The above C# code is 120 lines of code, divided into 9 different files. The Hyperlambda equivalent is 5 lines of code in one file. This declarative aspect of Hyperlambda makes you on average 20 times more productive, and reduces your technical debt by 95%.

Hyperlambda has been [officially recognised by Microsoft in several articles](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/june/csharp-make-csharp-more-dynamic-with-hyperlambda), and is currently being used by thousands of companies and individuals all over the world to solve software development backend problems. Hyperlambda is async to the bone, and have scalability and performance traits that's almost on pair with C# and .Net 9.

## AI Agents

The combination of meta programming and declarative constructs, in a homoiconic development environment, makes Hyperlambda extremely useful as a tool to create AI agents, sometimes allowing you to create highly complex AI agents, without having to write a single line of code yourself. You can see an example of this in the following video, where I create an AI agent that creates AI agents.

[![Watch the video](https://img.youtube.com/vi/NyDZ5OzREbk/maxresdefault.jpg)](https://www.youtube.com/watch?v=NyDZ5OzREbk)

## Components

Magic is a complete software development platform, and contains among other things the following components.

* [Hyper IDE](https://docs.ainiro.io/dashboard/hyper-ide/) is a Low-Code and No-Code IDE with AI integrated into every aspect
* [SQL Studio](https://docs.ainiro.io/dashboard/sql-studio/) allows you to execute SQL towards connected databases, in addition to visually designing your databases
* [Endpoint Generator](https://docs.ainiro.io/dashboard/endpoint-generator/) allows you to rapidly generate CRUD endpoints and other types of endpoints that can be automatically generated somehow
* [Machine Learning](https://docs.ainiro.io/dashboard/machine-learning/) allows you to create AI types with RAG data, and even AI agents allowing you to integrate the LLM into your business apps
* [Endpoint browser](https://docs.ainiro.io/dashboard/endpoints/) is Magic's own version of Swagger, allowing you to browse and test your HTTP endpoints
* [Users & Roles Management](https://docs.ainiro.io/dashboard/users-roles/) allows you to manage users and roles in an RBAC-based access control system
* [Task Manager](https://docs.ainiro.io/dashboard/task-manager/) allows you to create and persist Hyperlambda tasks, in addition to scheduling these to execute in the future at a specific date, or according to a repetition pattern
* [Plugins](https://docs.ainiro.io/dashboard/plugins/) allows you to install plugins such as NetSuite integrations, HubSpot integrations, etc
* [Audit Log](https://docs.ainiro.io/dashboard/log/) allows you to see your cloudlet's log
* [Hyperlambda Playground](https://docs.ainiro.io/dashboard/hyperlambda-playground/) allows you to execute Hyperlambda in immediate mode to perform some task or test a piece of code
* [Database Administration](https://docs.ainiro.io/dashboard/databases/) allows you to connect to any MySQL, PostgreSQL, or Microsoft SQL Server database - In addition to also creating SQLite databases as you see fit
* [Configuration](https://docs.ainiro.io/dashboard/configuration/) allows you to manage your server's configuration
* [Chatbot Wizard](https://docs.ainiro.io/dashboard/chatbot-wizard/) allows you to create AI chatbots based upon RAG by scraping a website and embedding a simple JavaScript file into your website

Combined, the above components allows you to rapidly manage your application(s) from an extremely high level, giving you clarity and control over your application. The project is being actively maintained by AINIRO, specifically Thomas Hansen, and has been actively maintained for more than 6 years. The project is particularly useful for anything related to AI, but is also a _"general purpose backend development environment"_. For more information about Magic, please refer to its documentation below.

* [Magic Cloud Documentation](https://docs.ainiro.io)

## Getting Started

Clone the repository, and make sure you’ve got .Net Core version 9 installed, the latest version of NodeJS, and Angular, and enter the "backend" and "frontend" folders with two terminals, and execute the following commands in the respective terminals.

1. Backend folder `dotnet run`
2. Frontend folder `ng serve`

After some few minutes you should be able to access the dashboard from localhost:4200, and login to your cloudlet using `http://localhost:5000` as your backend URL. The intial username and password combination is the same; "root" and "root". Once logged in, you have to provide a root password and your email address. Once this is done, you can start using your cloudlet.

If you want to play with the AI capabilities of Magic, you'll have to configure your cloudlet with an OpenAI API key - You can do this from for instance the Misc/Configuration parts of your dashboard. You can also [use Docker](https://docs.ainiro.io/getting-started/) if you wish, and if this sounds like too much hassle, we can [help you with a managed cloudlet](https://ainiro.io/buy).

**NOTICE** - I've only got Linux and OSX builds of the VSS plugin for SQLite, so all the AI features will only work on OSx (Mx CPU) or Linux.

## License

This project, and all of its satellite project, is licensed under the terms of the MIT license, as published by the Open Source Initiative. See LICENSE file for details. For licensing inquiries you can contact Thomas Hansen thomas@ainiro.io

## Copyright and maintenance

The projects is copyright of Thomas Hansen 2019 - 2025, and professionally maintained by [AINIRO.IO](https://ainiro.io).
