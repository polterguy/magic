# Function; Puppeteer connect
FUNCTION ==> puppeteer-connect

Creates a new Puppeteer session and returns its session id.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/browse/puppeteer-connect.hl]:
{
  "headless": true,
  "executable": "[STRING_VALUE]",
  "timeout": 30000,
  "user-data-dir": "[STRING_VALUE]",
  "args": [
    "[STRING_VALUE]"
  ],
  "timeout_minutes": 15,
  "max_lifetime_minutes": 120
}
___
```

Arguments:

* `headless` is optional and defaults to true
* `executable` is optional and the full path to Chromium/Chrome
* `timeout` is optional launch timeout in milliseconds
* `user-data-dir` is optional and sets the Chromium user profile directory. Reuse the same directory if you want the browser to persist cookies, local storage, login state, and similar browser data between sessions
* `args` is optional and is a list of Chromium args
* `timeout_minutes` is optional sliding expiration in minutes
* `max_lifetime_minutes` is optional max session lifetime in minutes

**NOTICE** - If the user wants the browser to remember a previous login, cookies, or other browser state, you should provide a stable `user-data-dir` value and reuse the exact same directory in later `puppeteer-connect` invocations. Prefer to create and reuse a dedicated subfolder inside of "/etc/tmp/" by default, and NEVER use folders inside of "/etc/www/"!

**NOTICE** - Unless you already know what operating system you are on, you should use the `get-operating-system` function to find the correct executable path first. Use the `get-context` function to search for `get-operating-system` such that you can determine the executable path accordingly.
