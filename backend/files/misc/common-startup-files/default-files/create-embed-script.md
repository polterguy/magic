Workflow; Create AI Chatbot Embed Script
WORKFLOW ==> create-embed-script

An embeddable website AI chatbot can be embedded on any CMS using the chatbot's embed script. The embed script is a simple JavaScript file with a total size of roughly 50KB, and it will initialize the chatbot on you HTML pages. The result becomes an 'AI chatbot' button injected into the web pages of the website, which once clicks starts a chatbot session with a machine learning type.

If the user asks you for the embed script for an AI chatbot, or a machine learning type, then you will need the following information from the user.

1. type - The full name of your machine learning type.
2. header - The header of the chat window. Defaults to 'Ask me anything'.
3. button - The text of the chatbot button that opens the window. Defaults to 'AI Chat'.
4. rtl - Implies “right to left” and allows for creating a user interface for RTL languages. Defaults to false.
5. color - The color of the text in the chatbot. Defaults to #fefefe and is the CSS color for the chatbot's text.
6. start - The “starting” color of the background. Defaults to #0000ff and is the starting colour of a linear-gradient CSS color for the background of the AI chatbot.
7. end - The “ending” color of the background. Defaults to #0000d0 and is the ending colour of a linear-gradient CSS color for the background of the AI chatbot.
8. link - The text color of hyperlinks inside the chat window.
9. theme - The name of your theme / css / skin. Defaults to 'modern-bubbles'.
10. references - If true, will return references from the backend for training snippets having URL citations. Defaults to false. Defaults to false.
11. placeholder - The placeholder text for the textbox field in the chat window. Defaults to 'Write your question here ...'.
12. position - Positioning of the chatbot button and window. Must be either “right” or “left”. Defaults to right.
13. clear_button - If true, adds a clear button, that allows the user to clear his current session and create a new session. Defaults to false.
14. copyButton - If true, adds a “copy response” button for every response provided by the LLM. Defaults to false.
15. follow_up - If true, adds the required JavaScript parts to support follow up questions. Notice, the system instruction needs to be correctly changed for this to work. Defaults to true. Defaults to true.
16. new_tab - If true, opens up all hyperlinks in a new browser tab. Defaults to false.
17. code - If true, will add the required logic to syntax highlight code when the LLM returns code segments. Defaults to false.
18. animation - Allows for referencing an animation CSS selector. Notice, currently only “ainiro_blink” is supported, which you can see on our website. Defaults to null.
19. popup - “Popup text” that’s shown 5 seconds after the AI chatbot loads, to make it slightly more “instrusive” and visible. Defaults to null.
20. hidden - If true, displays the chatbot’s button invisible, allowing you to create your own chatbot button to trigger the actual chatbot window. Defaults to false.
21. sticky - If true, will automatically reopen the chatbot when the user is navigating to a new page, and the chatbot was already visible on the previous page. Defaults to false.
22. attachments - If true, allows your users to attach files and upload these to the LLM. Defaults to false.
23. extra - Additional extra parameters, which can be anything, and is typically used for complex integrations where “instance information” is required on a “per chatbot window” basis. Defaults to null.
24. history - If true the chatbot will allow its users to see historical requests and continue previous conversations.

Don't show all of the above options to the user, but rely on the defaults for most values, and show these to the user and offer the user to change your defaults. The machine learning type however is the most important argument and must be an existing machine learning type.

If the user asks you to create an embed script for an AI chatbot, you should ask the user for the following information.

1. Machine learning type the user wants to use
2. Values for above settings

Once the user is satisfied with his choices, return the following HTML to the user.

```html
&lt;script src="[BACKEND_URL_HERE]/magic/system/openai/include-chatbot.js?rtl=[RTL]&clear_button=[CLEAR_BUTTON]&follow_up=[FOLLOW_UP]&copyButton=[COPY_BUTTON]&new_tab=[NEW_TAB]&code=[CODE]&references=[REFERENCES]&position=[POSITION]&type=[MACHINE_LEARNING_TYPE]&header=[HEADER]&popup=[POPUP]&button=[BUTTON_TEXT]&placeholder=[PLACEHOLDER]&color=[TEXT_COLOR]&start=[START_BG_VOLOR]&end=[END_BG_COLOR]&link=[LINK_COLOR]&theme=[THEME]&sticky=[STICKY]&attachments=[ATTACHMENTS]&history=[HISTORY]" defer&gt;&lt;/script&gt;
```

Replace the above [BACKEND_URL_HERE], [RTL], etc according to settings chosen by user.

**NOTICE** - It's CRUCIAL that you HTML endode the result before returning it to make sure it displays correctly in the frontend. And also please realise that only machine learning types WITHOUT any authorization requirements can actually be embedded.
