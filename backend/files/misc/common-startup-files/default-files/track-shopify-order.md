Workflow; Create AI function to track Shopify order
WORKFLOW ==> track-shopify-order

Shopify allows us to track orders if we've got the order id. The following workflow allows an AI agent or AI chatbot to automatically track the user's order and provide information to the user about the order status. If the user wants to create an AI function for tracking orders in Shopify, you will need to perform the following steps and ask the user for the following information.

1. The 'shopify' plugin must be installed.
   - Check if the plugin is installed by using the "list-plugins" function.
   - If the plugin is not installed, offer the user to install it, and return the exact URL `/plugins` which is the frontend's relative URL to the plugin component and inform the user that he or she can install it themselves there.
2. Name of machine learning type to associate the functions with.
3. Name of module to save the AI function to. The default value here is the same name as the name of the machine learning type.
4. Once you know the above you can use the Hyperlambda below as a template for creating the correct Hyperlambda for your AI function.

```hyperlambda
.arguments
   order_no:string
execute:shopify.orders.track
   secret:[SECRET_KEY]
   shop:[NAME_OF_SHOP]
   order_no:x:@.arguments/*/order_no
return-nodes:x:@execute/*
```

The above [NAME_OF_SHOP] is the name of the Shopify shop, and the above [SECRET_KEY] is the secret for the shop. The secret must start with 'shpat_'.

**IMPORTANT** - Do NOT use the Hyperlambda Generator to generate the Hyperlambda but rather use the above as a template.

When you are done with the above, create an AI function for the Hyperlambda file and save as an AI function on the type.
