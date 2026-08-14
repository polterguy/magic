# Function; Execute Python code
FUNCTION ==> execute-python

This function allows you to execute Python code. Either raw code, or a Python file.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/execute-python.hl]:
{
  "file": "[STRING_VALUE]",
  "code": "[STRING_VALUE]",
  "args": [
    "[VALUE_1]",
    "[VALUE_2]"
  ],
  "stdin": "[STRING_VALUE]",
  "working-directory": "[STRING_VALUE]",
  "timeout": "[INTEGER_VALUE]"
}
___
```

Arguments:

- `file` is optional full file name and path to Python file on disc.
- `code` is optional raw Python code to execute.
- `args` is optional positional arguments passed into execution, either as a list of values or as a single argument string.
- `working-directory` is an. optional working directory to use during execution.
- `stdin` is optional stdin input to the Python execution.
- `timeout` is optional number of seconds before execution is killed. Defaults to 30.

If the user asks you to generate and execute Python code, You can use this function to accomplish your goal.

**IMPORTANT** - You cannot rely upon 3rd party libs when creating Python code. You can only use stdlib. And you must either pass in `code` or `file`, and not both!
