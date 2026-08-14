# Function; Execute Terminal command
FUNCTION ==> execute-terminal-command

The following function can be used to execute a terminal command.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/execute-terminal-command.hl]:
{
  "command": "[STRING_VALUE]",
  "args": [
    "[VALUE_1]",
    "[VALUE_2]"
  ],
  "working-directory": "[STRING_VALUE]"
}
___
```

Arguments:

- `command` is mandatory and the command to execute.
- `args` is optional arguments passed to the command. You can pass this either as a list of argument values or as a single quoted argument string.
- `working-directory` is optional working directory from where to execute the command from. This path is resolved using the same virtual file system root as file operations, so a value such as `/modules/netsuite` resolves to the corresponding absolute folder inside Magic's configured `/files/` root.
