
# Magic Cloud - Fully Autonomous AI-based Software Development Assistant

> Magic is an open-source, self-hostable AI software development platform that generates and runs full-stack business applications and AI agents from natural language.

Magic is built on top of [OpenAI](https://openai.com) and [Hyperlambda](https://ainiro.io/hyperlambda/), a DSL specifically created to solve anything related to backend software development, and to be _"The AI agent programming language"_. Create full stack apps, in an open source environment, resembling Lovable, Bolt, or Replit. Use natural language as input, and host it on your own hardware if you wish.

**No additional "backend connectors" or "database connectors" required**!

**Hence, ZERO lockin!!**

Everything is 100% integrated, thx to SQLite, with optional MySQL, PostgreSQL, and Microsoft SQL Server capabilities. Basically, run the whole shebang on _your own hardware_ if you wish ...

## Open Source _"Vibe Coding"_ platform

Below is an app that was created with the following prompt; 

> Create me a full stack app to manage VIP customer for a car dealership

The whole process took about 30 minutes in total, with less than a handful of errors, correcting the LLM or giving feedback some 5 to 10 times during the process. All bugs were easily tracked down and eliminated by a seasoned software developer during the process.

![CRM system for car dealership](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/vip-crm.png)

Magic asked a handful of control questions, before it automatically generated the database, created the backend code based upon the integrated Hyperlambda Generator, before finally assembling the frontend based upon the API - Complete with authentication and authorization, 100% secure (of course!) Everything deployed locally, on the integrated and built-in webserver.

**Once you save the code, you can test it! No _"deployment"_ or _"publish"_ required to test code!**

## Bad ass AI Agent!

Below is the AI agent in Magic 100% autonomously browsing the web and filling out a _"contact us"_ form. This particular example is using the integrated headless browser, that allows your AI agent to _"see"_ the web, autonomously browse it, and solve tasks.

![Headless browser in Magic filling out a form](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/headless-browser-magic.png)

However, you can also vibe code AI agents integrated with your CRM system, ERP system, legacy databases, _"whatever"_. Magic fundamentally _is_ an AI agent, for building software and AI agents. What you use it for, is up to you.

In addition to the AI agent in its dashboard, that generates entire full stack apps using nothing but natural language input - There's a whole range of additional components in the system allowing you to automate software development, such as for instance;

* CRUD generator, creating API endpoint using database meta information
* SQL Studio, allowing you to visually design and manage your SQL databases
* Built-in RBAC
* Hyper IDE, for manually edit code in a VS code like environment
* Task manager for administrating and scheduling tasks
* Machine Learning component allowing you to manage AI agents and chatbots
* Plugin repository for installing both frontend types of websites, and backend code
* Plus many more ...

Below is a screenshot from Hyper IDE.

![Hyper IDE](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-generated-code.png)

The above illustrates how Magic facilitates for _"comment driven development"_, as in provide _"natural language instructions"_ with a declarative comment, and have the system implement the code using the built-in AI code generator.

## Also a web server

Magic is also a web server, allowing you to _instantly deploy_ everything, without compilation, build processes, complex pipeline connectors, etc. So the process is as follows;

1. Create your prompt
2. Press enter
3. Test!

... or use the integrated headless browser to automatically generate AI workflows that _tests your system automatically once done_!

This comes in stark contrast to other less sophisticated tools, such as Lovable and Bolt44 that requires you to deploy into _2 different 3rd party providers before you can even test your code_. Hence, the development model in Magic is probably for most practical concerns roughly 10x faster and more optimised ...

In addition to having the ability to generate pure JS, CSS, and HTML frontends, that's immediately being served, without any deployment pipelines - The system also comes with several pre-built frontend systems out of the box, such as the [AI Expert System](https://ainiro.io/ai-expert-system), which allows you to serve password protected AI agents, and/or for that matter deliver entire SaaS AI solutions.

The system is particularly well suited for creating AI agents.

## MCP support

Magic comes with MCP support out of the box. Install the plugin called _"mcp"_, and configure Claude Cowork/Code or OpenAI's Codex to use Magic cloud as an MCP server, and Claude/Codex is automagically extended with all HTTP endpoint files you've got in your _"modules"_ folder. Not only does this unlock new capabilities for both Claude and Codex, but it also reduces your token consumption by roughly 80%.

![Saving 80% of your token costs on Claude](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/claude-savings.png)

## Headless Browser

Magic contains a headless browser, PuppeteerSharp specifically, that allows you to browse the web as a human being, fill out forms, click buttons, etc.

* _"Go to xyz website, identify their contact us form and change URLs if required, and fill out their contact us form"_

You can see an example of that prompt in the screenshot below.

![Headless browser in Magic filling out a form](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/headless-browser-magic.png)

You can calculate your own saving [here](https://hyperlambda.dev/savings-calculator).

## Git integration

Contrary to other vibe coding tools, Magic Cloud was built for software developers from day 1. That means among other things it's got Git integrated as an integral part of the platform. This allows you to setup any amount of pipelines you wish, using Git for code, or GitHub workflows for deployments.

1. Create a new project
2. Vibe code all the tools and even your GitHub workflows if you wish
3. Commit and push

Below is how the integrated AI agents objectively compares Magic Cloud to Lovable and Bolt44.

![A comparison between Lovable, Bolt44 and Magic Cloud](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/lovable-bolt44-versus-magic-cloud.png)

## Python, Terminal, and C# integration

Generate and execute Python scripts on the fly, and have the LLM use these as _"tools"_. In addition, you can use BASH and the underlying terminal, and you can create Hyperlambda extension keywords using C#.

Since Magic is running in a protected service account by default, this is actually quite safe - However, obviously do *not* open up endpoints allowing 3rd party users to generate and execute arbitrary Python code.

You can also persist Python scripts, and reference these later as _"tools"_, permanently widening the capabilities of AI agents, or for that matter integrate Python execution into your endpoints and services.

![Executing Python from Magic Cloud](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/assets/images/executing-python-code.png)

**NOTICE** - You _obviously_ have to be logged in as root to generate and execute both Python scripts, Terminal scripts, and to create C# extensions. Magic has a unique security model however, that eliminates entire _axioms_ of security-related _"holes"_. But you still need to _keep_ your brain. Magic is not (pun!) a _"magic pill"_.

## Deploy anywhere

If you choose to create AI agents instead of full stack app, something the system is particularly well suited for, you can choose to deliver these as password protected AI expert systems, or embeddable AI chatbots, embedded on some website. Below is our AI chatbot. You can try it [here](https://ainiro.io)

![Embeddable AI chatbot](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/ai-chatbot.png)

## 20x times faster than Python

When we measure Hyperlambda and Magic Cloud, it's roughly around 20 times faster than similar solutions built in Python, such as Fast API or Flask. Compared to LangChain, it's probably around 50 times faster, in addition to making it much easier to create workflows, due to being able to create backend code using English, instead of _"drag and drop WYWIWYG hell"_. Hyperlambda solutions are in general on pair with C# combined with Entity Framework, both on scalabaility and performance. Below is Hyperlambda versus Fast API and Flask.

![Python versus Hyperlambda](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/hyperlambda-performance.png)

Magic Cloud is built in C# and .Net Core 10.

On average, Magic is probably around 100 to 1,000 times faster than _"graphical workflow solutions"_, such as N8N, LangChain, Zapier, Make, etc - Due to relying upon an actual programming language instead of JSON, XML, or Markdown based _"workflow files"_. Executing a piece of Hyperlambda is around 1,000 times faster than parsing _"dynamic logic"_ from YAMNL or JSON files.

Hyperlambda is almost on pair with pure C# code!

## Getting started

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

Save it somewhere, and execute `docker compose up` or something, visit `localhost:5555`, login with _"root"_ / _"root"_, and configure the system. You can [read more here](https://docs.ainiro.io/getting-started/) for alternatives, such as running the codebase directly on your own machine.

You can also watch me [guide you through the setup process here](https://www.youtube.com/watch?v=k6eSKxc6oM8).

### Bring your own OpenAI API key

To use the system you'll need an OpenAI API key. You can create one [here](https://platform.openai.com/api-keys).

**NOTICE** - To gain access to `gpt-5.4`, you might have to deposit $51 into your OpenAI API account. Magic depends upon OpenAI, and without depositing money into OpenAI, you won't get access to gpt-5.4, which is the default model in Magic for _"vibe coding"_. You might get GPT-4.1 to work during vibe coding, but 5.4 is __much better__!

If you are absolutely allergic to OpenAI, there are Ollama and HuggingFace plugins for the system, allowing you to _"override"_ the inference functions with Ollama or HuggingFace models and endpoints - But embeddings can only be created with OpenAI's APIs.

### DIY Home Cloud

Magic easily installs on for instance a Mac Mini, using the Docker images. By combining it with CloudFlare tunnel, you can setup a web server in a couple of minutes, serving applications and data out of your home. The link below is running out of my house in Larnaca / Cyprus, using a CloudFlare tunnel. We've tested it from US, Norway, and a whole range of countries, and it's relatively responsive, considering the connection it's being served over.

* [CRM dashboard served from DIY web server](https://home.ainiro.io/analytics-crm)

Below is a screenshot of the system.

![Analytucs CRM Dashboard](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/analytics-crm-screenshot.png)

Use such a setup to completely bypass any censorship, and or spying, allowing you to completely avoid both spying and censoring of your content or applications.

## LLM

The system internally is using OpenAI's gpt-5.4, with minimum reasoning turned on - But everything is tunable, and you can with a little bit of effort exchange the integrated defaults with Ollama or Hugging Face models. However, the Hyperlambda Generator's training dataset is _not_ made public, and we have no plans to do so either. This means that worst case scenario, you're still running your already generated systems perfectly fine, without the ability to generate new systems - Even if you were to loose the Hyperlambda Generator for some reasons.

The Hyperlambda Generator is however a fairly unique thing, due to Hyperlambda's integrated security model, something that allows for dynamically generating tools on the fly, and securely executing the generated code on the backend. Something demonstrated in our [natural language API](https://ainiro.io/natural-language-api).

The following is a screenshot from a publicly available page (natural language API), where we accept input from any random visitor. The input is then transformed into Hyperlambda using our LLM, for then to be executed __in-process__ behind our DMZ in our militarized zone. We've offered hackers $100 if they can somehow exploit the endpoint to access PII or extract information using it. So far none have claimed money from us. We've had this offer out now for 3 months without any succeeding so far.

![Natural Language API](https://raw.githubusercontent.com/polterguy/polterguy.github.io/master/images/natural-language-api.png)

If you can hack the above API endpoint, I will give you $100!

## Unique Security Model

The point about Hyperlambda, is that it's first of all running in a sandbox environment, so it doesn't have access to the file system outside of its own sandbox. In addition, it's got the ability to whitelist individual functions, according to its built-in RBAC system, allowing for your server to accept code as input, and still securely execute it - Without even knowing its origin.

The above is only possible by restricting function invocations at the execution level, which as far as I know, Hyperlambda is the _only_ programming language in the world that currently does.

This makes Hyperlambda uniquely fit for AI agents that needs to _"generate tools on demand"_, since it allows to owner of the solution to specify a subset of the server's vocabulary as _"legal functions"_, while no other functions are allowed.

The above allows you to deliver AI agents that creates their own tools __on demand__ - Without widening attack surface or creating security holes.

## Technology

Magic Cloud is built in .Net Core 10, and its dashboard is Angular. Hyperlambda again was entirely invented and created by yours truly, and you can find some articles about its unique technology below.

* [Make C# more Dynamic with Hyperlambda](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/june/csharp-make-csharp-more-dynamic-with-hyperlambda)
* [Active events, one design pattern instead of a dozen](https://learn.microsoft.com/en-us/archive/msdn-magazine/2017/march/patterns-active-events-one-design-pattern-instead-of-a-dozen)

However, Hyperlambda, and hence Magic Cloud by association, was built on a unique design pattern called _"Active Events"_, or _"Slots and Signals"_, which is an in-process model for executing _"dynamic functions"_, that's 100% unique for Magic Cloud. Active Events is at the core of Hyperlambda, and completely eliminates 100% of all cross projects dependencies, resulting in 100% _"perfect"_ encapsulation and cohesion.

The above design pattern, and Hyperlambda combined, is what facilitates for such extreme levels of security in Magic Cloud, where we can confidently trust that no AI-generated code does anything harmful - Simply because it doesn't have _permissions to do something malicious_ - Unless somebody explicitly gave it such permissions.

> I'm so confident in its codebase quality, I'll give you $100 if you can find a (severe security) related bug in its backend code!

## Maintenance

Magic Cloud and Hyperlambda is developed and maintained by [AINIRO.IO](https://ainiro.io). We offer hosting, support, and software development services on top of Magic Cloud, in addition to delivering AI agents, chatbots, and AI solutions.

## License

This project, and all of its satellite project, is licensed under the terms of the MIT license, as published by the Open Source Initiative. See LICENSE file for details. For licensing inquiries you can contact Thomas Hansen thomas@ainiro.io

## Copyright and maintenance

The projects is copyright of Thomas Hansen 2019 - 2025, and professionally maintained by [AINIRO.IO](https://ainiro.io).
