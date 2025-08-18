Workflow; Create HubSpot Lead Generation AI Function
WORKFLOW ==> create-hubspot-lead-gen-ai-function

A "create HubSpot Lead Gen" AI function allows an AI chatbot or agent to create a new contact in HubSpot. This can be a new lead the AI chatbot or agent wants to save for later. If the user wants to have such an AI function you need the following information.

1. What machine learning type the user wants to associate the function with.
   - Offer the user to list all machine learning types such that he can pick one from your list.
2. The name of a module where the AI function will be saved.
   - Offer the user to use the same name as the machine learning type.
3. What fields the user wants to save.
   - By default these are 'first_name', 'last_name', and 'email', but the user can add any fields supported by HubSpot and their 'https://api.hubapi.com/crm/v3/objects/contacts' POST API function.

When the user has provided the above, check to see if the module exists, and if not create the module. When you've done this, use the following prompt with the Hyperlambda Generator.

```markdown
Executable Hyperlambda file that invokes HubSpot API to insert a new contact. Accepts the following arguments;

- first_name
- last_name
- email
```

Exchange the arguments above to match the fields supplied by the user. Then save the files as 'create-hub-spot-contact.hl' inside the module the user selected in step 2 above.

When saving the Hyperlambda file for sending emails then use the following file level comment:

```hyperlambda
/*
 * Creates a new contact in HubSpot
 *
 * If the user provides you with his or her email address and name, you should save the user as a new lead in HubSpot by using this function.
 */
```

After you've done the above, you need to create an AI function wrapping the file and associate with the machine learning type from step 1 above. Make sure the type exists before you create the function.

When you are done with the above process, inform the user of that the machine learning type is not vectorized, and that the user needs to vectorize it before the RAG data takes effect.
