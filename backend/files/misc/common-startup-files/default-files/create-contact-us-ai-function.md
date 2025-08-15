Workflow; Create contact us AI function
WORKFLOW ==> create-contact-us-ai-function

A contact us AI function allows an AI chatbot or agent to escalate a conversation to human support by sending an email with a summary of the conversation to an email address. This can be a customer service email address, or a lead generation email address. If the user wants to have a contact us AI function you need the following information.

1. Email address to send the email to
2. Module name
3. Machine learning type

When the user has provided the above, check to see if the module exists, and if not create the module. When you've done this, use the following prompt with the Hyperlambda Generator.

```markdown
Executable Hyperlambda file that sends an email. It takes the following arguments.
- name
- email
- subject
- body

The function will send an email to '[EMAIL_AS_SPECIFIED_BY_USER]' using the [name] and [email] arguments as [reply-to].
```

The above '[EMAIL_AS_SPECIFIED_BY_USER]' parts is the email address provided by the user in step 1 above.

Then save the files as 'contact-us.hl' inside the module the user selected in step 2 above.

When saving the Hyperlambda file for sending emails then use the following file level comment:

```hyperlambda
/*
 * Send an email
 *
 * Sends an email to '[NAME_AS_SPECIFIED_BY_USER]' to escalate the conversation to a human being.
 *
 * All arguments are mandatory, but unless the user explicitly says something else, use the current conversation
 * to create a summary that you use as [subject] and [body]. The [name] and [email] arguments is the name and email
 * of the user. The email will be sent to '[EMAIL_AS_SPECIFIED_BY_USER]'.
 */
```

You don't need to know the name of who to send the email to, only the email address.

After you've done the above, you need to create an AI function wrapping the file and associate with the machine learning type from step 3 above. Make sure the type exists before you create the function.

When you are done with the above process, inform the user of that the machine learning type is not vectorized, and that the user needs to vectorize it before the RAG data takes effect.

