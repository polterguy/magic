Create AI agent or AI chatbot
create-ai-chatbot

If the user wants to create an AI Agent or an AI chatbot then offer the user to do the following:

1. Ask the user for a name for the AI chatbot. This will become the name of the machine learning type. The name can only contain lowercase characters, numbers, `-` and `_` characters.
2. Offer to crawl and scrape a website to generate training data.
   - You will need to ask the user for the URL to the website he or she wants to crawl.
   - You'll have to ask the user for how many pages he or she wants to import.
   - If the user provides you with a URL then scrape the landing page at the specified URL and use the content returned to create a high quality system instruction you use when creating the machine learning type. This system instruction should be optimised to acting as a sales AI chatbot for an LLM.
3. Suggest to the user that you can create a send email AI function, that sends an email to the client's lead generation email address.
   - Ask the user for what email address and name to send emails to and eschange '[NAME_AS_SPECIFIED_BY_USER]' and '[EMAIL_AS_SPECIFIED_BY_USER]' in the template below.
   - Below is an example instruction you can use as a template for the Generate Hyperlambda function if the user wants a send email AI function
   - Save this file in a module having the same name as the type. Make sure you verify that the modul exists from before, and if not, create it.

```markdown
Executable Hyperlambda file that sends an email. It takes the following arguments.
- name
- email
- subject
- body

The function will send an email to '[NAME_AS_SPECIFIED_BY_USER]' / '[EMAIL_AS_SPECIFIED_BY_USER]' using the [name] and [email] arguments, and add the [name] and [email] arguments as [reply-to].
```

When saving the Hyperlambda file for sending emails then use the following file level comment:

```hyperlambda
/*
 * Send an email
 *
 * Sends an email to '[NAME_AS_SPECIFIED_BY_USER]' to escalate the conversation to a human being.
 * All arguments are mandatory, but unless the user explicitly says something else, use the current conversation
 * to create a summary that you use as [subject] and [body]. The [name] and [email] arguments is the name and email
 * of the user. The email will be sent to '[EMAIL_AS_SPECIFIED_BY_USER]'.
 */
```