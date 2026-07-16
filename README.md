
# Magic Cloud - Fully Autonomous AI-based Software Development Assistant

> Magic is an open-source, self-hostable AI software development platform that generates and runs full-stack business applications and AI agents from natural language.

Magic is built on top of [OpenAI](https://openai.com) and [Hyperlambda](https://ainiro.io/hyperlambda/), a DSL specifically created to solve anything related to backend software development, and to be _"The AI agent programming language"_. Create full stack apps, in an open source environment, resembling Lovable, Bolt, or Replit. Use natural language as input, and host it on your own hardware if you wish.

No additional _"backend connectors"_ or _"database connectors"_ required - **zero lock-in**. Everything is 100% integrated, thanks to SQLite, with optional MySQL, PostgreSQL, and Microsoft SQL Server capabilities. You can run the whole thing on your own hardware if you wish.

## Open Source _"Vibe Coding"_ Platform

Below is an app that was created with the following prompt;

> Create me a full stack app to manage VIP customer for a car dealership

The whole process took about 30 minutes in total, with less than a handful of errors, correcting the LLM or giving feedback some 5 to 10 times during the process. All bugs were easily tracked down and eliminated by a seasoned software developer during the process.

![CRM system for car dealership](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/vip-crm.png)

Magic asked a handful of control questions, before it automatically generated the database, created the backend code using the integrated Hyperlambda Generator, and finally assembled the frontend based upon the API - complete with authentication and authorization. Everything was deployed locally, on the integrated and built-in web server.

**Once you save the code, you can test it! No _"deployment"_ or _"publish"_ required to test code.**

## Getting Started

The easiest way to get started is to use Docker and create a _"docker-compose.yaml"_ file with the following content;

```yaml
version: "3.8"

services:
  backend:
    image: servergardens/magic-backend:latest
    platform: linux/amd64
    container_name: magic_backend
    restart: unless-stopped

    ports:
      - "4444:4444"

    volumes:
      - magic_files_etc:/magic/files/etc
      - magic_files_data:/magic/files/data
      - magic_files_config:/magic/files/config
      - magic_files_modules:/magic/files/modules

  frontend:
    image: servergardens/magic-frontend:latest
    container_name: magic_frontend
    restart: unless-stopped

    depends_on:
      - backend

    ports:
      - "5555:80"

volumes:
  magic_files_etc:
  magic_files_data:
  magic_files_config:
  magic_files_modules:
```

Save it somewhere, execute `docker compose up`, visit `localhost:5555`, login with _"root"_ / _"root"_, and configure the system. You can [read more here](https://docs.ainiro.io/getting-started/) for alternatives, such as running the codebase directly on your own machine.

You can also watch me [guide you through the setup process here](https://www.youtube.com/watch?v=k6eSKxc6oM8).

### Bring your own OpenAI API key

To use the system you'll need an OpenAI API key. You can create one [here](https://platform.openai.com/api-keys).

**NOTICE** - To gain access to `gpt-5.4`, you might have to deposit $51 into your OpenAI API account. Magic depends upon OpenAI, and without depositing money into OpenAI, you won't get access to gpt-5.4, which is the default model in Magic for _"vibe coding"_. You might get GPT-4.1 to work during vibe coding, but 5.4 is _much_ better.

If you don't want to use OpenAI, there are Ollama and HuggingFace plugins for the system, allowing you to _"override"_ the inference functions with Ollama or HuggingFace models and endpoints - but embeddings can only be created with OpenAI's APIs.

**Notice** - You can also use Magic through the MCP server, at which point you don't need an OpenAI API key.

### DIY Home Cloud

Magic easily installs on for instance a Mac Mini, using the Docker images. By combining it with a CloudFlare tunnel, you can set up a web server in a couple of minutes, serving applications and data out of your home. The link below is running out of my house in Larnaca, Cyprus, through a CloudFlare tunnel. We've tested it from the US, Norway, and a whole range of countries, and it's surprisingly responsive considering the connection it's being served over.

* [CRM dashboard served from DIY web server](https://home.ainiro.io/analytics-crm)

Below is a screenshot of the system.

![Analytics CRM Dashboard](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/analytics-crm-screenshot.png)

A setup like this keeps your applications and your data entirely under your own control, on hardware you own.

## The LLM that Cannot Hallucinate Functions

Magic runs Hyperlambda. Hyperlambda can be generated with our own proprietary LLM. Because we're not generating code, but rather an AST, we can analyse the generated code and reject it if it contains hallucinated functions. The result is that the Hyperlambda Generator **cannot return hallucinated functions or constructs** - hallucinated code is rejected before it's ever returned to the caller. Like any LLM it can still produce logically wrong code - but every single function it invokes is guaranteed to actually exist.

Combined with the ability to also restrict the vocabulary, this allows you to deliver AI agents that dynamically grow their tool space on demand - **without** security risks.

## AI Agents

Below is the AI agent in Magic autonomously browsing the web and filling out a _"contact us"_ form. This particular example is using the integrated headless browser, which allows your AI agent to _"see"_ the web, autonomously browse it, and solve tasks.

![Headless browser in Magic filling out a form](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/headless-browser-magic.png)

You can also vibe code AI agents integrated with your CRM system, ERP system, legacy databases - _"whatever"_. Magic fundamentally _is_ an AI agent, for building software and AI agents. What you use it for is up to you.

In addition to the AI agent in its dashboard, which generates entire full stack apps using nothing but natural language input, there's a whole range of additional components in the system allowing you to automate software development, such as;

* CRUD generator, creating API endpoints using database meta information
* SQL Studio, allowing you to visually design and manage your SQL databases
* Built-in RBAC
* Hyper IDE, for manually editing code in a VS Code-like environment
* Task manager for administrating and scheduling tasks
* Machine Learning component allowing you to manage AI agents and chatbots
* Plugin repository for installing both frontend websites and backend code
* Plus many more ...

Below is a screenshot from Hyper IDE.

![Hyper IDE](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-generated-code.png)

The above illustrates how Magic facilitates _"comment driven development"_ - provide natural language instructions as a declarative comment, and have the system implement the code using the built-in AI code generator.

## Also a Web Server

Magic is also a web server, allowing you to _instantly deploy_ everything, without compilation, build processes, or complex pipeline connectors. The process is as follows;

1. Create your prompt
2. Press enter
3. Test!

... or use the integrated headless browser to automatically generate AI workflows that _test your system automatically once done_.

This is in stark contrast to other tools, such as Lovable and Bolt, which require you to deploy into two different 3rd party providers before you can even test your code. For most practical concerns, the development model in Magic is therefore dramatically faster.

In addition to generating pure JS, CSS, and HTML frontends that are immediately served without any deployment pipelines, the system also comes with several pre-built frontend systems out of the box, such as the [AI Expert System](https://ainiro.io/ai-expert-system), which allows you to serve password protected AI agents, and/or deliver entire SaaS AI solutions.

The system is particularly well suited for creating AI agents.

## MCP Support

Magic comes with MCP support out of the box. Install the plugin called _"mcp"_, and configure Claude Cowork/Code or OpenAI's Codex to use Magic Cloud as an MCP server, and Claude/Codex is automagically extended with all HTTP endpoint files you've got in your _"modules"_ folder. Not only does this unlock new capabilities for both Claude and Codex, it also reduces your token consumption by roughly 80% in our measurements. You can calculate your own savings [here](https://hyperlambda.dev/savings-calculator).

![Saving 80% of your token costs on Claude](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/claude-savings.png)

## Headless Browser

Magic contains a headless browser - PuppeteerSharp specifically - that allows your AI agents to browse the web as a human being would; fill out forms, click buttons, etc. An example prompt;

* _"Go to xyz website, identify their contact us form and change URLs if required, and fill out their contact us form"_

You can see the result of that exact prompt in the screenshot in the AI Agents section above.

## Git Integration

Contrary to other vibe coding tools, Magic Cloud was built for software developers from day 1. Among other things, that means it's got Git integrated as an integral part of the platform. This allows you to set up any amount of pipelines you wish, using Git for code, or GitHub workflows for deployments.

1. Create a new project
2. Vibe code all the tools, and even your GitHub workflows if you wish
3. Commit and push

Below is how the integrated AI agent compares Magic Cloud to Lovable and Bolt.

![A comparison between Lovable, Bolt and Magic Cloud](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/lovable-bolt44-versus-magic-cloud.png)

## Python, Terminal, and C# Integration

Generate and execute Python scripts on the fly, and have the LLM use these as _"tools"_. In addition, you can use Bash and the underlying terminal, and you can create Hyperlambda extension keywords using C#.

Since Magic runs in a protected service account by default, this is quite safe - but obviously do _not_ open up endpoints allowing 3rd party users to generate and execute arbitrary Python code.

You can also persist Python scripts and reference these later as _"tools"_, permanently widening the capabilities of your AI agents, or integrate Python execution into your endpoints and services.

![Executing Python from Magic Cloud](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/assets/images/executing-python-code.png)

**NOTICE** - You have to be logged in as root to generate and execute Python scripts and terminal scripts, and to create C# extensions. Magic has a unique security model that eliminates entire _axioms_ of security-related _"holes"_ - but you still need to keep your brain. Magic is not (pun!) a _"magic pill"_.

## AI Chatbots and Expert Systems

If you choose to create AI agents instead of full stack apps - something the system is particularly well suited for - you can deliver these as password protected AI expert systems, or as embeddable AI chatbots on any website. Below is our AI chatbot. You can try it [here](https://ainiro.io).

![Embeddable AI chatbot](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-chatbot.png)

## Performance

In our measurements, Hyperlambda and Magic Cloud are roughly 20 times faster than similar solutions built in Python, such as FastAPI or Flask, and around 50 times faster than LangChain - in addition to making it much easier to create workflows, since you create backend code using English instead of _"drag and drop WYSIWYG hell"_. Hyperlambda solutions are in general on par with C# combined with Entity Framework, on both scalability and performance. Below is Hyperlambda versus FastAPI and Flask.

![Python versus Hyperlambda](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/hyperlambda-performance.png)

Compared to _"graphical workflow solutions"_ such as N8N, Zapier, and Make, Magic is typically 100 to 1,000 times faster, since it relies upon an actual programming language instead of parsing _"dynamic logic"_ from JSON, XML, or YAML based workflow files.

Magic Cloud is built in C# and .Net Core 10, and Hyperlambda is almost on par with pure C# code.

## LLM

The system internally uses OpenAI's gpt-5.4, with minimum reasoning turned on - but everything is tunable, and you can with a little bit of effort exchange the integrated defaults with Ollama or Hugging Face models. However, the Hyperlambda Generator's training dataset is _not_ made public, and we have no plans to change that. Worst case scenario, you're still running your already generated systems perfectly fine, without the ability to generate new systems - even if you were to lose the Hyperlambda Generator for some reason.

The Hyperlambda Generator is however a fairly unique thing, due to Hyperlambda's integrated security model, which allows for dynamically generating tools on the fly, and securely executing the generated code on the backend. Something demonstrated in our [natural language API](https://ainiro.io/natural-language-api).

The following is a screenshot from a publicly available page (the natural language API), where we accept input from any random visitor. The input is transformed into Hyperlambda using our LLM, and then executed __in-process__ behind our DMZ. The endpoint has now been publicly available for 3 months, with a standing offer of $100 to anyone who can exploit it to access PII or extract information - so far nobody has succeeded.

![Natural Language API](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/natural-language-api.png)

If you can hack the above API endpoint, the $100 is yours!

## Unique Security Model

Hyperlambda runs in a sandbox environment, so it doesn't have access to the file system outside of its own sandbox. In addition, it's got the ability to whitelist individual functions, according to its built-in RBAC system, allowing your server to accept code as input and still securely execute it - without even knowing its origin.

This is only possible by restricting function invocations at the execution level, which as far as I know makes Hyperlambda the _only_ programming language in the world that currently does this.

This makes Hyperlambda uniquely fit for AI agents that need to _"generate tools on demand"_, since it allows the owner of the solution to specify a subset of the server's vocabulary as _"legal functions"_, while no other functions are allowed. You can deliver AI agents that create their own tools __on demand__ - without widening your attack surface or creating security holes.

## Technology

Magic Cloud is built in .Net Core 10, and its dashboard is Angular. Hyperlambda was entirely invented and created by yours truly, and you can find some articles about its unique technology below.

* [Make C# more Dynamic with Hyperlambda](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/june/csharp-make-csharp-more-dynamic-with-hyperlambda)
* [Active events, one design pattern instead of a dozen](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/march/patterns-active-events-one-design-pattern-instead-of-a-dozen)

Hyperlambda, and hence Magic Cloud by association, is built on a unique design pattern called _"Active Events"_, or _"Slots and Signals"_, which is an in-process model for executing _"dynamic functions"_. Active Events is at the core of Hyperlambda, and eliminates cross-project dependencies, resulting in extreme levels of encapsulation and cohesion.

This design pattern, combined with Hyperlambda, is what facilitates the security model in Magic Cloud, where we can confidently trust that AI-generated code does nothing harmful - simply because it doesn't have _permissions to do something malicious_, unless somebody explicitly gave it such permissions.

> I'm so confident in the codebase quality, I'll give you $100 if you can find a severe security-related bug in its backend code!

## Maintenance

Magic Cloud and Hyperlambda are developed and maintained by [AINIRO.IO](https://ainiro.io). We offer hosting, support, and software development services on top of Magic Cloud, in addition to delivering AI agents, chatbots, and AI solutions.

## License

This project, and all of its satellite projects, is licensed under the terms of the MIT license, as published by the Open Source Initiative. See the LICENSE file for details. For licensing inquiries you can contact Thomas Hansen thomas@ainiro.io.

## Copyright and Maintenance

The project is copyright Thomas Hansen 2019 - 2026, and professionally maintained by [AINIRO.IO](https://ainiro.io).
