

## Version 19.11.3

Minor bug fix release

* Fix a bug that would insert two [.type] nodes when editing comments/arguments


----


## Version 19.11.1

This is a major feature release, with the most important part being that you can now use natural language to generate working Hyperlambda code. Use the _"Where the Machine Creates the Code"_ widgets throughout your dashboard to generate Hyperlambda code as you see fit.

* AI-based No-Code and Low-Code features
* Released Hyperlambda _"generator"_ allowing you to use natural language to create Hyperlambda code.
* Much better support AI chatbot


----


## Version 19.10.30

Minor feature release

* Allowing exception message to propagate if user is root


----


## Version 19.10.27

Bugfix release

* Minor bug fixes in Hyper IDE to improve UX.


----


## Version 19.10.25

Feature release

* Avoid having mixins fail due to consecutive {{ characters not actually being mixins.


----


## Version 19.10.24

Feature release

* API endpoint to upload training snippet from 3rd party systems


----


## Version 19.10.23

Feature release

* Support for using GPT-4.5 model as completion model


----


## Version 19.10.11

Feature release

* Increases upload size and timeout on Kestrel


----


## Version 19.10.8

Feature release

* Fixed a Hyperlambda mixin bug.


----


## Version 19.10.7

Feature release

* Showing invocation of all functions in history tab. Previously only the last function invocation's result would be visible in history, making it impossible to see results of function invocations if the LLM returned multiple invocations in one go. This is now fixed.


----


## Version 19.10.5

Feature release

* Support for OpenAI o3 model


----


## Version 19.10.4

Minor feature release

* Allow for overriding the completion slot from UI


----


## Version 19.10.3

Minor feature release

* New theme and minor label changes in dashboard


----


## Version 19.10.2

Minor feature release

* Support for completely dropping all CAPTCHA logic by setting CAPTCHA value to -0.1
* Allowing to override chat slot and model's max tokens.


----


## Version 19.10.1

Feature release

* Stabilised and improved the distinct keyword density search generator
* Improved DuckDuckGo search to also include description as returned from DuckDuckGo. This should improve the LLM's capability to choose the correct URL to scrape when asking it to scrape "most relevant URLs".


----


## Version 19.10.0

Feature release

* The endpoint generator can now create "keyword density search" endpoints for SQLite databases
* Improved dashboard GUI


----


## Version 19.9.13

Feature release

* Much better Gen-AI support in SQL Studio by attaching schema and database type


----


## Version 19.9.10

Feature release

* Signaling frontend with AI function invocation information during success


----


## Version 19.9.7

Feature release

* Significantly improved AI Expert System's ability to create permalinks


----


## Version 19.9.2

Feature release

* Permalinks for chat items in AI Expert System


----



## Version 19.9.0

Feature release

* AI Agent system message from OpenAI now by default renders tables for results with 2 to 5 columns.
* AI functions are throwing exceptions if function result overflows maximum token context size.
* Default function invocations on new type are set to 25.
* Disabling import CSV file button for Magic database to avoid using it as a dumpster.
* Backend generator can now generate distinct endpoints.
* Backend generator can now generate distinct count endpoints.
* Significantly improved backend generator with better prompt engineered comments ensuring higher quality AI agents, and avoiding overflowing because of each filter argument having comments.
* Changed default verbose setting value for backend generator to true.
* Changed CSV file import to import empty strings as null values.
* Added --- separators between individual training snippets as we're sending it to OpenAI to provide better semantics to the LLM.
* Increased maximum number of training snippets the system can retrieve from 10 to 20. This should improve accuracy for AI agents since these might pull in the wrong snippets first.
* When generating AI function for a single type the system will ask you for a type, instead of copying the function invocation to the clipboard.
* Changing flavor on machine learning type might trigger a change in maximum context tokens on type too.
* Improved list all functions function to return all prompts triggering function invocations more accurately.
* In AI Agent system message we're now prompt engineering the system message to by default treat all primary keys as optional by default, unless explicitly told otherwise.
* Export table as CSV file support. Notice, does not stream CSV file so for hundreds of thousands of records it might fail.
* Self correcting and providing correct feedback if user provides a prompt that results in too many function invocations.
* Simplified comments created by backend generator to have better meta prompt engineering.
* Simplified meta prompt engineering to give smaller snippets and more accurate results for AI Agent flavor.
* Making sure we only use the first 100 arguments when creating an AI function from Hyper IDE.
* The backend generator will now be able to create group by endpoints, allowing us to aggregate data using pivot table logic.


----


## Version 19.8.10

Feature release

* During uploading of CSV files to create a table, it will now generate numeric columns if possible.


----


## Version 19.8.9

Feature release

* Improved upon speech recognition and TTS.


----


## Version 19.8.7

Feature release

* Support for adding AI functions directly into system message.
* Endpoint Generator now supports creating aggregate endpoints for using min, max, sum, and avg.
* Started working on Speech Recognition in AI Expert System and Magic backend.


----


## Version 19.8.6

Feature release

* Import CSV file directly into database, which creates the database, columns, and imports the CSV file's content.
* Bugfix in backend generator when switching between two different databases bot having the same number of tables.


----


## Version 19.8.5

Bugfix

* Fixed an issue when vectorizing types with more than 1,000 snippets.


----


## Version 19.8.4

Feature release

* Finally, "popup" support on button, allowing users to declare a piece of text that will "pop up" after some time delay.


----


## Version 19.8.3

Bug fix release

* Some times the cloudlet would run out of memory during inserts into vss_ml_training_snippets (vectorization). This happens only with *very* large types, with 10,000 training snippets and more. However, to avoid it entirely, we're now "paging" inserts, by only inserting 1.000 items into vss_ml_training_snippets at the time.


----


## Version 19.8.0

Feature release

* Changing from .Net Core 8 to .Net Core 9.
* New theme which is a small theme, looking more similar to "traditional" AI chatbots.


----


## Version 19.7.68

Feature release

* Blocking IP addresses from accessing the AI chatbot entirely if it's being abused.


----


## Version 19.7.67

Feature release

* Logging HTTP headers including the original IP address when chat invocations fails due to "too many daily questions".


----


## Version 19.7.66

Feature release

* Allowing for configuring AI chatbot to only answer n number of questions per user per day. Configure this as "magic:openai:max-daily-requests".


----


## Version 19.7.65

Feature release

* [query] argument to [http.*] slots that automatically decorates the URL.


----


## Version 19.7.64

Feature release

* Bug fix for reCAPTCHA
* Jane system instruction template intended to be a customer service and support type of system message
* Better margins at the bottom of charts


----


## Version 19.7.63

Feature release

* Sometimes chat requests would fail because of no reCAPTCHA site key has been configured, even if the type apparently had 0 as its reCAPTCHA value. This happened because of null values in the database, that the UI would show as 0 values. This is now fixed.


----


## Version 19.7.62

Feature release

* Improved system instructions by removing irrelevant templates our from core project and improving remaining templates


----


## Version 19.7.61

Feature release

* Simplified and improved charts


----


## Version 19.7.60

Feature release

* Support for exporting conversations as a single text field, opening up all filtered history items in Machine Learning as a single textbox allowing user to copy and paste these into a CRM for instance. Notice, this will apply a limit of 100 items, resulting in that no more than 100 items sorted by created ascendingly can be exported this way.


----


## Version 19.7.58

Feature release

* Support for grouped charts


----


## Version 19.7.40

Feature release

* Fixed Linux font issue with charts


----


## Version 19.7.38

Feature release

* Fixed bug in stack charts preventing us from using double values.


----


## Version 19.7.37

Feature release

* Implementation for stack charts.


----


## Version 19.7.36

Feature release

* Basic (BETA) implementation for rendering charts using [image.chart] from magic.lambda.image


----


## Version 19.7.35

Feature release

* Support for configuring success message for AI functions using configuration settings with the key of "magic:chat:functions:success-message".


----


## Version 19.7.34

Feature release

* Support for "ainiro_prompt" QUERY parameter inside thye AI chatbot that if specified and not empty or null, will trigger the AI chatbot to immediately initialise and start answering the specified question.


----


## Version 19.7.33

Feature release

* Removed support for GPT-O1 models since it's not good enough for use as a general chat model. Among other things it doesn't support streaming.


----


## Version 19.7.31

Feature release

* Support for GPT-O1 models


----


## Version 19.7.30

Feature release

* Support for GPT-O1 models


----


## Version 19.7.29

Feature release

* Support for ILIKE in PgSQL


----


## Version 19.7.28

Feature release

* Branding support for AI Expert System


----


## Version 19.7.27

Feature release

* Stabilising OpenID Connect Provider logic


----


## Version 19.7.26

Feature release

* OpenID Connect support for id_tokens, allowing users to authenticate in the AI Expert System using OIDC.
* Payment / subscription support in the AI Expert System with help from the Stripe module and the stripe-subscription-template module.

In this release we've released a BETA version of our Micro AI-SaaS solution allowing you to use the AI Expert System as your own foundation for a SaaS company selling access to a custom password protected AI chatbot answering questions according to your data, and/or AI functions.


----


## Version 19.7.25

Feature release

* Started working on OpenID Connect to use for instance Google or Microsoft as SSO providers. NOT FINISHED, but partially implementedin AI Expert System which allows you to now login using OIDC resulting in creating a default _"guest"_ role user the first time users are logging in.


----


## Version 19.7.24

Minor feature release

* Support for Safe AI Agent, which is an AI Agent type of system message that does _not_ change the server's state, making it suitable for publicly exposed AI chatbots.
* Support for uploading images only into your AI type.
* Avoid having installation of frontend deleting any existing files but instead overwriting files if they exists from before.
* Removing references from chatbot when AI function is invoked, since it completely changes the context, implying references are no longer needed.


----


## Version 19.7.23

Feature release

* Much better prompt engineering in AI functions and workflows.
* Support for Basic authentication in HTTP GET workflow and AI function.
* HTTP GET workflow and AI function now returns HTTP headers returned from server.
* Filtering on templates in add training snippet implemented.
* Animation support on chatbot during embed. Only one type of animation, but the system supports chosing multiple animations.
* Fixed a bug that sometimes would render links as [object Object] if you selected "open in new tab" on embed.
* Fixed another JS bug related to highlighting of code that would sometimes open chatbot with a bug.


----


## Version 19.7.22

Minor feature release

* Animation support on chatbot button by adding animation QUERY parameter to JavaScript include URL. Currently only 'ainiro_blink' animation exists.


----


## Version 19.7.21

Feature release

* Much better AI assistant system message called _"AI Agent"_ accessible as plugin system message in OpenAI plugin.
* Allowing modules to declare custom system messages.
* URL search returning only URLs (in OpenAI plugin), both as workflow and as action.
* Allowing for creating a training snippet by specifying a URL which scrapes the URL spicing the model.
* Combination workflow allowing to combine SQL search with VSS search.
* Increasing maximum_context_token to a max value of 40,000 and max_request_tokens max value to 25,000.
* Retrieving system_message in "list-functions". Notice, this requires prompt engineering on the training snippet, and/or function invocation to return high quality information.
* Removed AI Assistant flavor since it's now replaced by AI Agent flavor in OpenAI plugin.
* Better URL set import, allowing for automatically vectorizing after import, etc.
* Allowing for template fields for model name as we change system message using flavor pre-selected system messages.


----


## Version 19.7.20

Minor bug fix release

* Better error feedback during importing of URL set CSV file.
* Rendering tables in AI chatbot and AI Expert System.
* CRUD slots for OpenAI plugin allowing the user to perform keyword-based search through training snippets.

----


## Version 19.7.19

Bug release

* Getting "origin" correctly applied for chat requests, also for SPA sites doing HTML5 routing. Notice, needs to flush cache on related chatbots due to updates to chatbot JavaScript.
* Support for gpt-4o-mini model. This is the by far fastest 4th generation version of OpenAI's models, and much less expensive than gpt-4o and other models, while almost as smart as gpt-4o and gpt-4
* Support for uploading URL set being a CSV file with URLs which the system scrapes and adds to the specified machine learning type.

----


## Version 19.7.18

Feature release

* Support for code syntax highlighting during embed, which will syntax highlight any code segments returned from the server.
* Allowing for uploading CSV files as plain text.

----


## Version 19.7.17

Minor bug fix release

* Fixed a bug related to PostgreSQL that didn't return the postgres database itself, which is sometimes used to create relevant tables

----


## Version 19.7.16

Minor bug fix release

* Fixed a bug that sometimes triggers the wait icon on the client when no functions are actually invoked.

----


## Version 19.7.15

Minor feature and bug fix release

* Content production system message avoiding certain words and phrases as it copywrites.
* Avoid having one corrupted page in a PDF file stop the parsing of the entire file.
* Keeping the existing filename as is when we're uploading files into the /etc/system/openai/pdf/ folder.
* Throwing exception during PDF import if a file with the same name has been previously imported, unless user explicitly informs us that he or she wants to overwrite the file.

----


## Version 19.7.14

Minor bug fix release

* Stronger function invocations.

----


## Version 19.7.13

Minor feature release

* Swapped out Showdown with Marked Markdown parser, which is supposed to be much better.

----


## Version 19.7.12

Bug fixes

* Making sure AI Expert System renders responsively on phones etc.
* Fixed bug with Hyperlambda parser that doesn't correctly handle CR/LF sequences, especially when there are two consecutive sequences.
* Better UX when adding AI function to type by allowing user to click the ESC key, and/or click the backdrop to close dialog, yet still having the training snippets update for the model if there are additional training snippets as a result of adding AI Functions.
* Added template training snippets, which will recursively search through all _"ts-templates"_ folders in modules and system folder for Markdown files that can be used as generic template snippets for things such as _"Search the web"_, _"Scrape URL"_ or _"Send marketing email"_, etc.
* Allowing for re-vectorizing models. This will destroy existing embeddings and re-vectorize the snippets for the type. Useful if we for some reasons need to change the embedding model or something similar. This is only given to the user as an option if the user clicks the vectorize button, and all snippets are already vectorized.

----


## Version 19.7.11

Bug fixes

* Bug fix when passing in [_session] and [_user-id] to AI Functions that prevented these from correctly being applied.

----


## Version 19.7.10

Bug fixes

* Passing in session, user id and type as [_session], [_user-id] and [_type] to AI Functions, to avoid these clashing with other arguments.

----


## Version 19.7.9

Bug fixes and new features.

* Implemented the ability to invoke mixin logic from the system message, allowing the user to dynamically replace parts of the system message with the result of executing some Hyperlambda code.
* Passing in username as user_id in AI Expert System to make sure we associate requests with the authenticated user.
* Passing in [user-id] to AI Function invocations, to allow creating AI functions that executes within the context of the specified user.
* Explicitly removing [session] and [user-id] from AI function invocation that OpenAI returns if existing, to avoid passing these in twice due to erronously prompt engineered function invocation snippets.
* Storing result of function invocation in ml_requests such that it becomes easier to debug to see what functions are returning.
* Automatically changing system messages contaning '[TYPE_NAME_HERE]' as a template parameter to use the correct type when a flavor system message is selected.

----


## Version 19.7.8

Bug fixes and new features.

* Fixed a bug in [magic.ai.get-context] dynamic slot that prevented us from invoking it without a [session].
* Created an AI Assistant type of system message that works particularly well in combination with AI functions created for CRUD endpoints generated using the Backend Generator, for then to being added to some model or type.
* Changed default vector model back to Ada, since the new one is only messsing with its distances.
* Fixed a bug with how the user is retrieved on [fork] thread invocations, that would result in a null reference exception unless the user had claims.
* Added a generic send email workflow AI Function, to be used from password protected models, that can send emails to anyone.

----


## Version 19.7.7

Feature release.

* Added a generate image workflow allowing you to create AI chatbots that creates images using DALL-E 3. Notice, this workflow can be found in the OpenAI plugin.
* Added the ability to recursively generate AI Functions for entire folders from Hyper IDE.

----


## Version 19.7.6

Minor bug fix release

* Small improvement of prompt engineering in AI functions related to optional arguments, to avoid having OpenAI return empty strings for arguments not explicitly specified.
* Significantly improved UI in AI Expert System.

----


## Version 19.7.5

Minor bug fix release

* Better handling of JSON parameters returned from OpenAI. Sometimes OpenAI would return bogus function invocations, with JSON payloads being empty without any fields. Now we can handle such payloads without errors.
* HTTP GET workflow and action, allowing you to create AI functions that invokes HTTP GET endpoints to easily integrate with 3rd party services.

----


## Version 19.7.4

Minor bug fix release

* Better handling of cache as we install a new module.
* Better handling of machine learning type when querying what types exists, in that it will return all models now if you're root. Otherwise there's no way to edit a model that's not configured to be accessible by root.
* Minor bug fix with authorisation not allowing root users to invoke lambda objects requiring quthentication unless it was done on a different thread.
* Dropping CAPTCHA requirements entirely if user is authenticated for simplicity reasons. If the user is authenticated, and doing a DDOS thing, we've got more pressing issues than bot attacks.

----


## Version 19.7.3

Bringing back our Expert AI system

* Released our AI Expert System, allowing you to use password protected AI models. Notice, this is a plugin and can be installed through the plugins component as a frontend plugin.
* Added the ability to install frontends from our plugins component, in addition to modules as we've always had.
* Some minor UI changes on historical chat requests to improve user experience.
* Better filtering on plugin apps, also searching through description when filtering.
* Improved the displaying of images in the plugin repository, to avoid having images fill the entire modal dialogue.
* Adding a _"Go to frontend"_ button in dashboard to make it easier to access frontends, such as for instance the AI Expert System, etc.
* Elevating a [fork] thread's access right to the access right the creating thread has automatically, to allow for [fork] invocations to execute lambda objects that requires authentication or authorisation, while inheriting the original thread's access rights. This is done by passing in the _"auth ticket"_ into the [fork] invocation using a scoped context object only accessible from C# code.

----


## Version 19.7.2

Feature release with some stabilising issues fixed

* Truncating referrer field on history requests to avoid it overflowing modal dialogue
* Checking both completion in training snippets, meta in training snippets, and system message on type when invoking AI functions. Previously, it was impossible to invoke AI functions if they were only declared in completion. This made it impossible to manually create AI functions by creating training snippets that were not based upon clicking an AI function.
* Added a _"Copy to AI function"_ button on Hyperlambda files in Hyper IDE. This button will create an AI function declaration wrapping the specified Hyperlambda file, and put the function declaration on your clipboard.
* When adding a function invocation to an AI type/model, we're now removing the [session] argument automatically to avoid having OpenAI believing it needs to supply this argument. The session argument is the current user's session, and automatically added by the backend, and should therefore not be dynamically determined by OpenAI.
* When OpenAI returns a function invocation, we create multiple historical requests for a single prompt, with the same prompt. One for the original prompt and answer OpenAI returned, another for the response OpenAI returned after the function was invoked. Starting as of from version 19.7.2 we will store these in your History tab as; '[1] - foo', '[2] - foo', etc, to make it easier to find and see your historical requests originating from an AI function invocation.
* Configuration option on type/model for maximum number of function invocations (per prompt).
* Configuration option on type/model for maximum number of session items (per prompt).
* Using GPT-4o to summarizing snippets that are too long instead of GPT-4-turbo to save time and money.
* Minor improvements on comments in Backend Generator while wrapping tables, specifically adding argument comment describing HOW to order, using TABLE_NAME.COLUMN_NAME, making OpenAI more easily understand how to create filtering conditions.
* Communicating mandatory arguments as such in Backend Generator while generating CRUD endpoints wrapping database.
* Filter textbox on _"Add function"_ dialogue.

The max function invocations and session items allows you to configure the _"memory"_ and _"complexity"_ of each individual model, which might be beneficial in particular for complex models, where you need to allow for invoking many functions in order to solve some specific task, and/or you require the model to have a very long context window to remember previous messages. It is supposed to still respect the maximum context token count on a per model basis, so it should not have any possibility of overflowing the base model you're using.

----


## Version 19.7.1

Minor maintenance release

* Fixed a bug occurring only when both follow up questions exists, and reference or copy button has been enabled, that would add the references and the copy button to the wrong parent DOM element.
* Smoother scrolling with follow up questions, as in NOT scrolling if user has already scrolled up in chatbot to prevent "automatic scrolling".

----


## Version 19.7.0

A couple of severe bugs fixed, and AI functions improved significantly, especially for longer conversations.

* Fixed null reference exceptions in SQL Studio frontend that occurred if you selected an empty result set.
* Passing session into AI functions that requires a [session] argument. This allows us to associate functions invocations with individual sessions.
* Allowing for declaring AI functions in system message, which significantly increases their usability.
* Fixed a severe session error that occurred only after user had asked 5 questions or more in the same session.
* Created a rich and complex shopping cart demo plugin that illustrates how to use Magic Cloud to create an AI-based e-commerce chatbot that allows you to perform your entire shopping experience from inside the AI chatbot itself, including adding products to your cart, listing available products, and even the checkout process.

----


## Version 19.6.8

AI functions is now stabilised to become a production-grade feature.

* Fixed issue with dashboard not being able to invoke OpenAI correctly. This was a bug that entered the codebase in v19.6.7 because of the complexity related to AI functions.
* AI functions are no longer in BETA, and has been stabilised to become a production-grade feature.
* Filtering AI functions on **\[.type\]** only returning publicly available workflows by default, allowing the user to override this with a checkbox.
* Waiting animation on UI while we're waiting for AI function to execute.

----


## Version 19.6.7

**WARNING** - This is a BETA feature and it might change in future releases. If you use it, then please have in mind that it might change
in future releases of Magic Cloud.

Major update with support for _"functions"_ on Machine Learning types, allowing you to associate function invocations with
training snippets. The way these works, is that if you request a function using the chatbot, then this will be sent to OpenAI
with a declaration of how the function works. OpenAI will then ask you for parameters required to invoke the function. Your Magic
cloudlet will then invoke the function, and transmit the result of the invocation to OpenAI again, which then will have access
to the result of the function invocation and continue your instruction. To understand how these works, consider the following
question asked to an AI chatbot.

![Invoking AI functions from the AI chatbot](https://docs.ainiro.io/assets/images/invoking-two-ai-functions.png)

What happens in the above request is that first the AI chatbot returns context from your training snippets. One of the snippets
returned will resemble the following.

### List all functions

```
This workflow lists all functions for the specified [type]. [type] is mandatory and should always be "ainiro".

If the user asks you to perform an action associated with this function invocation, then inform the user of that you will try, and do not return follow up questions, but instead end your response with the following:

___
FUNCTION_INVOCATION[/system/misc/workflows/list-functions.hl]:
{
  "type": "string"
}
___

It is very important that you put the FUNCTION_INVOCATION parts and the JSON payload inside of two ___ lines. If the user did not provide all mandatory arguments, then ask the user for these before returning the FUNCTION_INVOCATION parts.
```

OpenAI will then respond by asking the user to supply any mandatory arguments. In the above there are none, since the only argument (type) will default to "ainiro". Once the above _"function"_ is done executing (a function is just an AI workflow), it will again
invoke OpenAI with the result, at which point OpenAI will understand it's got enough data to invoke the _"send-owner-email"_ function.

Since the user supplied both a name, email address, and informed OpenAI how to create the content of the email, OpenAI will return
another function invocation, which the cloudlet interprets and executes as another workflow file, resulting in an email sent to
the owner of the cloudlet.

Notice, an AI _"function"_ is just a Hyperlambda workflow, which implies if you try to install a function into your machine
learning type, Magic will return all your AI workflows, allowing you to use these as you see fit. This allows you to create
your own Hyperlambda workflows, and use these as AI functions in your machine learning type.

The prompt for an AI function is the first line found in the workflow's initial file comment, and the completion
is dynamically constructed from the rest of the workflow's comment. Adding an an AI function to your type results in a new
training snippet, that can be prompt engineered any ways you see fit, as long as you ensure OpenAI returns
a correct function invocation declaration somehow. Below is an example of how it looks like when you add an AI function
to a type. Clicking the _"Install"_ button opens up the _"Create new training snippets"_ dialogue, allowing you to prompt
engineer the function before you add it if required.

![Adding an AI function to your machine learning type](https://docs.ainiro.io/assets/images/adding-an-ai-function-to-machine-learning-type.png)

**Warning!** You are responsible to make sure your workflows cannot somehow corrupt your cloudlet, and/or leak
sensitive information. Access to executing functions does _not_ have any authorisation mechanisms currently, albeit they might in the future. This implies that everybody with access to your chatbot can execute your AI functions. However, it is impossible to execute 
a function that has not been explicitly added to the machine learning type.

The same function can be added multiple times with different prompt engineering, allowing you to create multiple training
snippets with the same function invocation declaration.

### Additional changes

In addition to the above major BETA feature, we've got the following changes for this release.

* Showing meta information when editing snippets.
* Styling of HR elements in AI chatbot.
* Removed cloudlet server-side caching of JavaScript files for AI chatbot under the assumption of that CloudFlare does a much better job.
* Disabling chatbot submit button faster to avoid submitting the same prompt twice.
* Better handling of HR elements in chatbot, to allow for having multiple sections of data returned from OpenAI.
* Plus other minor bug changes and improvements.

----


## Version 19.6.6

Minor maintenance release with only a single feature being referrer field on chatbot requests.

* Referrer field on chatbot items allowing the user to see the URL at which some question was being asked.
* Removed redundant debug logging invocation that accidentally got into the core code.

----


## Version 19.6.5

Minor maintenance release with mostly bug fixes and few features.

* Created a changelog component, being the component where you're probably reading this. This component is intended to communicate changes to make it easier to see progress.
* Increased context size to maximum 10 items from previously 5 items, for models with especially small training snippets to be able to take advantage of their information foundation. This will slightly increase quality of responses from OpenAI, without significantly increasing your costs. Other changes from v19.6.2 still applies, such as a maximum session size of 5 chat messages, so the total context size should still on average be significantly reduced.
* Making edit training snippet dialogue larger. This is especially useful for training snippets with lots of data and images, since it reduces the need for scrolling.
* Better error feedback if Magic CAPTCHA fails, which might occur if the server's or the client's BIOS time is incorrect.
* Support for challenge-based Magic CAPTCHA invocations. Due to some global time servers not always being fully synchronised, and/or client machines having erronous time, this is a more fail safe method to use since it doesn't rely on client and server having synchronised BIOS times. It's a little bit more verbose, since it requires one additional HTTP GET invocation to retrieve a challenge from the server, but the trade offs are worth it, since multiple client machines have experienced issues from this lately due to (probably) some global time server becoming corrupted, resulting in clients especially on Windows seemingly failing the CAPTCHA verification. This method also stores each challenge on the server in memory cache, preventing the client from reusing the same token twice.
* Removing usage of Cache-Control since CloudFlare, at least theoretically, should habdle this better than us, allowing us to also globally invalidate the cache by will.

----

## Version 19.6.4

Minor maintenance release with some microscopic bug fixes.

* Scrolling of chat window to the bottom if it's got session items.

----

## Version 19.6.2

Mediumly large release, primarily focusing on quality of chat sessions.

* Better handling of session items on server during chat sessions, with less session items, using less tokens from OpenAI, without reducing quality significantly.
* Better context logic, which will only extract the top 5 items, regardless of threshold for chatbot.
* Finalised support for  the _"text-embedding-3-small"_ embeddings model. According to OpenAI this model should be better than _"text-embedding-ada-002"_, especially on non-English languages. Notice, if you want to use this embedding model you need to reduce the threshold to probably at least somewhere between -0.1 to -0.5 since it creates its embeddings using a new algorithm which sometimes results in a distance that superseeds 2.0. If you're using _"text-embedding-ada-002"_ with a threshold of 0.3, you should change your threshold to -0.25 at least if you're changing to _"text-embedding-3-small"_.
* Making sure the chatbot wizard is using the new embedding model from OpenAI with -0.25 as threshold.

----

## Version 19.6.0

This release focuses on making the core platform more stable.

* Making sure each cloudlet automatically creates a backup of its database once every 24 hours, at 1AM UTC time.
* During startup if database is corrupted the backup is restored. Database corruption would occur once in a blue moon, especially during upgrading. This created all sorts of problems for us, but should now at least in theory be 100% perfectly solved.

----

## Version 19.5.40

Minor maintenance release.

* Better default system message which reduces probability of displaying non-existent images.

----

## Version 19.5.38

Minor maintenance release.

* Support for GPT-4o model from OpenAI which is 50% of the cost and twice the speed of GPT-4-turbo.
