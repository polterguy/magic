# Function; List plugins
FUNCTION ==> list-plugins

List all plugins that are available to install into the backend allowing the user to install plugins during development.

If the user wants to see all available plugins, you must end your response with the following;

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/plugins/list-plugins.hl]
___
```

The above will return a list of all available plugins that can be installed in the system. A plugin again, is just a module, that downloaded from ainiro.io, and installed into the "/modules/" folder.
