---
title: magic.lambda.config
---

This project provides configuration settings slots for Magic. The project provides the following
slots, allowing you to retrieve configuration settings from your _"appsettings.json"_ configuration file,
in addition to saving and loading your configuration file.

* __[config.get]__ - Returns a configuration value from your configuration file with the specified key
* __[config.section]__ - Returns the specified configuration section from your configuration file with the specified key
* __[config.load]__ - Loads your _"appsettings.json"_ file and returns as a string
* __[config.save]__ - Saves your _"appsettings.json"_ file, sanity checking it's valid JSON before persisting your file

## How to use [config.get]

This slot allows you to retrieve configuration settings. To retrieve settings you can supply a
_"path"_ such as _"foo:bar"_ to for instance an invocation to **[config.get]**. This will traverse into
your _"foo"_ config setting, find its _"bar"_ key, and return the value of your _"bar"_ key. Below is
an example of usage.

```
config.get:"foo:bar"
```

Assuming your configuration file looks like the following.

```
{
   "foo": {
      "bar": 42
   }
}
```

... afterwards the value of your __[config.get]__ node will be the following.

```
config.get:42
```

**Notice** - Due to implementation details of .Net and its `IConfiguration` specifically, values
returned will _always_ be strings, and you'll have to manually convert these to other types, using for
instance the **[convert]** slot from magic.lambda. This _might_ change in a future release though.
You can also provide a default value that will be returned if no configuration value is found, such
as the following illustrates.

```
.foo:foo
config.get:"magic:foo:non-existing-key"
   get-value:x:@.foo
```

Since the above _"non-existing-key"_ doesn't exist in your configuration file, the above Hyperlambda will
return the value _"foo"_ being the result of the invocation to the **[get-value]** slot. This allows you
to create default values your code resorts to if the specified configuration setting doesn't exist.

