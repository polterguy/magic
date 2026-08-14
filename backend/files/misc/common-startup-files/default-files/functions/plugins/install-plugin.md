# Function; Install plugin
FUNCTION ==> install-plugin

Installs the specified [plugin] plugin into your backend. Notice, installation will be executed on a background thread, and it might take some time to install it. User will be notified in a message popup once done.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/plugins/install-plugin.hl]:
{
  "plugin": "[STRING_VALUE]"
}
___
```

Arguments:

* `plugin` is the mandatory argument being the name of the plugin the user wants to install
