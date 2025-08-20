Workflow; Create AI Chatbot Landing Page or Demo Page
WORKFLOW ==> create-ai-chatbot-landing-page

A landing page or a demo page for an AI chatbot allows users to test AI chatbots based upon machine learning types and serves as a demonstration of the chatbot. This allows users to QA test the chatbot and verify color choices, etc. If the user tells you to create an AI chatbot landing page or demo page, you will need the following information.

1. Machine learning type to use for the AI chatbot.
2. Website to copy and embed the chatbot on.

When the user has provided you with the above you are to execute the following function.

___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/create-landing-page.hl]:
{
  "website": "[STRING_VALUE]",
  "type": "[STRING_VALUE]",
  "host": "[STRING_VALUE]"
}
___

Arguments;

- website is mandatory and the full URL of what website to create a copy of.
- type is mandatory and the machine learning type to embed an AI chatbot for.
- host is mandatory and is always the backend URL from the system instruction.

When you are done with creating the landing page, return the URL of the landing page as Markdown such that the user can try it. The URL is [BACKEND_URL]/[TYPE]. Exchange '[BACKEND_URL]' with your backend URL and [TYPE] with the machine learning type.
