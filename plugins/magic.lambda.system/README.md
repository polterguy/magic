---
title: magic.lambda.system
---

This project contains _"system slots"_ to be able to invoke system commands, and/or dynamically compile and load plugins, etc. More specifically the project contains the following slots.

* __[system.compile]__ - Compiles a piece of C# code and returns the result as raw bytes
* __[system.plugin.load]__ - Loads the specified assembly and initialises any slots found in it
* __[system.plugin.unload]__ - Unloads a previously loaded plugin assembly and unregister any slots
* __[system.plugin.execute]__ - Short hand combining load with unload and a lambda object
* __[system.plugin.list]__ - Lists all dynamically loaded plugins
* __[system.execute]__ - Execute the specified command returning the result to caller
* __[system.debug]__ - Evaluates a lambda object while recording every slot invocation, and returns the recording
* __[system.os]__ - Returns description of your operating system
* __[system.is-os]__ - Returns true if your underlaying operating system is of the specified type

The most important feature of this project is probably that it gives you the ability to dynamically compile C# code, persist to an assembly/dll, and dynamically load this assembly as if it was a _"plugin"_.

## How to use [system.compile]

This method allows you to compile a piece of C# code and returns the assembly as a raw array of bytes. Example usage can be found below.

```
/*
 * Compiles a piece of C# and returns the compiled CLR assembky code as raw bytes.
 */
system.compile
   assembly-name:foo.dll
   references
      .:netstandard
      .:System.Runtime
      .:System.Private.CoreLib
      .:magic.node
      .:magic.signals.contracts
   code:@"

// Example C# code creating a Hyperlambda slot.
using System;
using magic.node;
using magic.signals.contracts;

// Our slot class.
[Slot(Name = "foo")]
public class Foo : ISlot
{
   public void Signal(ISignaler signaler, Node input)
   {
      input.Value = "Foo was here!";
   }
}"
```

The slot takes three arguments being as follows;

* __[assembly-name]__ - The name of your assembly
* __[references]__ - Being what references your code requires to compile. Notice, these are taken from the current AppDomain's assemblies, and assumes you've already got the assembly somehow loaded into your AppDomain. If you need to add assemblies that doesn't exist in your AppDomain you can use **[system.plugin.load]** before you compile your code.
* __[code]__ - Your actual C# code

If you want to persist the created assembly to disc you can use the **[io.file.save.binary]** slot from the _"magic.lambda.io"_ project.

### Dependency Injection and your IoC container

Because the IoC DI container is built as your assembly starts, you cannot rely upon the DI container in your code the way you can in normal statically compiled code. This implies you'll have to use the _"service locator"_ pattern to resolve services in your C# code. The service locator pattern is considered an _"anti pattern"_, but there aren't really many options here.

Below is an example of some C# code dynamically instantiating your `IMagicConfiguration` service while creating a slot that returns a configuration value to the caller.

```csharp

// Example C# code creating a Hyperlambda slot.
using System;

using magic.node;
using magic.library;
using magic.signals.contracts;
using magic.node.contracts;

// Our slot class.
[Slot(Name = "foo")]
public class Foo : ISlot
{
    readonly IServiceProvider _services;

    public Foo(IServiceProvider services)
    {
        _services = services;
    }

    public void Signal(ISignaler signaler, Node input)
    {
        var configuration = (IMagicConfiguration)_services.GetService(typeof(IMagicConfiguration));
        input.Value = configuration["magic:smtp:host"];
    }
}
```

If you save the above code to _"/etc/foo.cs"_ you can compile it and save it using the following code.

```
/*
 * The following code compiles the "/etc/foo.cs" file and saves it as an assembly
 * in "/etc/foo.dll".
 */
io.file.load:/etc/foo.cs
system.compile
   references
      .:netstandard
      .:System.Runtime
      .:System.Console
      .:System.Private.Uri
      .:System.ComponentModel
      .:System.Private.CoreLib
      .:System.Net.Primitives
      .:magic.node
      .:magic.node.extensions
      .:magic.library
      .:magic.signals.contracts
   code:x:@io.file.load
   assembly-name:foo.dll

// Saving our compiled CLR assembly to '/etc/foo.dll'.
io.file.save.binary:/etc/foo.dll
   get-value:x:@system.compile
```

## How to use [system.plugin.load] and [system.plugin.unload]

These slots allows you to load and unload assemblies and instantiate any slots found in it, and such dynamically during runtime changes your available slots. If you imagine you saved the above resulting compiled assembly as _"/etc/foo.dll"_, and you want to load it as a plugin, you could use code resembling the following.

```
system.plugin.load:/etc/foo.dll
```

Once the above code has executed you will have a native C# Hyperlambda slot called **[foo]** that you can use. Plugins loaded this way will stay in memory as a part of your AppDomain until either the process restarts, and/or you explicitly unload the plugin - Implying if your process restarts you'll need to ensure the plugin is reloaded again if you wish to continue using it. Dynamically loaded plugins will _not_ be automatically reloaded in any ways.

To unload the plugin after having used the assembly and it is no longer required, you should use **[system.plugin.unload]** to unload the assembly. If you recompile some C# code using the same assembly name this will be automatically done for you by consecutive invocations to **[system.plugin.load]** as long as the **[assembly-name]** argument is the same (case sensitive).

If you unload an assembly previously loaded it will be collected by the garbage collector automatically as long as you don't have references to it from another native assembly.

You can also load an assembly as raw bytes, such as the following example illustrates.

```
/*
 * Compiles a snippet of C# code down to a library,
 * for then to dynamically load it as a plugin.
 */
system.compile
   references
      .:netstandard
      .:System.Runtime
      .:System.Private.CoreLib
      .:magic.node
      .:magic.node.extensions
      .:magic.signals.contracts
   code:@"

// Example C# code creating a Hyperlambda slot.
using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

// Our slot class.
[Slot(Name = "foo")]
public class Foo : ISlot
{
   public void Signal(ISignaler signaler, Node input)
   {
      input.Value = $"Hi {input.GetEx<string>()}, how may I assist you?";
   }
}"
   assembly-name:foo.dll

// Loading assembly from raw bytes now that we've created it.
system.plugin.load:x:@system.compile

// Executing [foo] slot now dynamically injected into AppDomain.
.name:John Doe
foo:x:@.name

// Unloading plugin.
system.plugin.unload:foo.dll
```

Notice that in the last example above, we never actually save the assembly, but load it as a plugin from the raw `byte[]` returned from the **[system.compile]** invocation allowing you to dynamically compile and execute C# code without ever having to actually save the compiled result as a dll on disc. You still have to unload the assembly from your AppDomain using **[system.plugin.unload]**.

Also notice that the name of the assembly is not necessary the path of the assembly, but determined from **[assembly-name]**, allowing you to at least in theory have an assembly with _"/foo.dll"_ as its path, but _"bar.dll"_ being its name - Implying to unload the assembly you'll need to unload it as _"bar.dll"_, and listing it will return _"bar.dll"_ - While the physical location on disc of your assembly is _"/foo.dll"_.

Implying the assembly's name and its filename might differ.

## [system.plugin.execute]

This is a short hand slot for dynamically loading a plugin and executing a lambda object with the plugin loaded, for then to automatically unload the plugin at the end of the scope. Below is an example of usage that dynamically compiles some C# code that creates a slot, for then to executing a lambda object having access to this slot, and finish the execution with automatically cleaning up and unloading the dynamically added plugin.

```
/*
 * Compiles a snippet of C# code down to a library,
 * for then to dynamically load it as a plugin.
 *
 * This particular code creates a slot, but you can create any
 * code you wish, and it doesn't have to be Hyperlambda related.
 */
system.compile
   references
      .:netstandard
      .:System.Runtime
      .:System.Private.CoreLib
      .:magic.node
      .:magic.signals.contracts
   code:@"

// Example C# code creating a Hyperlambda slot.
using System;
using magic.node;
using magic.signals.contracts;

// Our slot class.
[Slot(Name = "bar")]
public class Bar : ISlot
{
   public void Signal(ISignaler signaler, Node input)
   {
      input.Value = "Hello from C#";
   }
}"
   assembly-name:bar.dll

// Loading assembly now that we've created it.
system.plugin.execute:x:@system.compile

   // Invoking dynamically created C# slot.
   bar

/*
 * Now the [bar] slot is no longer available
 * since the assembly has been unloaded due to
 * having gone out of scope.
 */
system.plugin.list
```

This slot is probably the closest you come to being able to using C# as a dynamic _"scripting language"_, allowing you to use it more like an interpreted language than a compiled language - Even though internally it's actually compiled to IL code and executed as such - Only the loading of the assembly resulting from the compilation process is 100% dynamic and automatic, including the cleaning up and unloading of the assembly from the AppDomain once the code has been executed.

This slot accepts either a string or a byte array. If you give it a string, it assumes your string is a relative path to an assembly on disc. If you provide it with a byte array, it assumes it's your raw assembly content. In such a regard it works similarly to **[system.plugin.load]**.

## [system.plugin.list]

This slot returns a list of all dynamically loaded plugins allowing you to traverse these as you see fit. Below is an example of usage.

```
system.plugin.list
```

## How to use [system.execute]

If you only want to execute a specific program in your system you can use **[system.execute]**, and pass in
the name of the command as a value. Arguments can be passed either as a single **[args]** string node,
or as children of **[args]**, one argument per child node. You can also
optionally specify **[working-directory]**.

```
system.execute:ls
   args:"-l"
```

Passing arguments as a list.

```
system.execute:python3
   args
      .:-c
      .:"print('hello')"
```

To specify a working directory.

```
system.execute:ls
   args:"-l"
   working-directory:"/"
```

**Notice** - The slot returns stdout as a string, and throws an exception on non-zero exit code, using
stderr if present.

## Querying operating system version

In addition to the above slots this project also contains the following slots.

* __[system.os]__ - Returns description of your operating system
* __[system.is-os]__ - Returns true if your underlaying operating system is of the specified type

The last slot above takes an argument such as _"Windows"_, _"OSX_, _"Linux"_, etc, and will return true
of the operating system you are currently running on belongs to the specified family of operating systems.
Below is example usage of both.

```
system.is-os:OSX
system.os
```

## How to use [system.debug]

This slot evaluates its children the same way **[eval]** does, but records every single slot invocation
as it happens, and returns the recording instead of leaving the lambda in place. This is what powers
_"Rewind"_ in Hyper IDE, allowing you to step through an execution after it has already finished.

```
system.debug

   .no:int:0
   set-value:x:@.no
      .:int:5
   math.increment:x:@.no
   return:x:@.no
```

The above returns one node per executed slot, each having the following children.

* __[slot]__ - Name of the slot that was invoked
* __[path]__ - Index path to the node that was invoked, such as _"0.1"_ for the second child of the first node
* __[elapsed]__ - Number of milliseconds the invocation took
* __[lambda]__ - The **entire** lambda object as Hyperlambda, exactly as it looked immediately after the invocation

The last point above is the interesting one. Since each step carries the whole lambda object and not
just the node that ran, moving from one step to the next is watching the program's own state evolve,
which is a very different thing from reading a stack trace and guessing what the values were.

If the lambda returned something, the recording ends with a **[returned]** node. If the lambda threw,
it ends with an **[error]** node having the exception message as its value and a **[type]** child with
the CLR type of the exception. An execution that throws is precisely the one you want to look at, so
the exception is caught and returned as a part of the recording rather than being allowed to discard
everything leading up to it.

```
system.debug

   .data
      .
         name:Thomas
   throw:This is recorded, and so is everything above it
```

Some things to be aware of.

* The lambda is cloned into a detached root before it is evaluated, such that expressions navigating upwards resolve the same way they would if the lambda was executed normally. This implies the slot cannot see nodes outside of itself.
* A **[return]** inside the lambda terminates the lambda being debugged, and not whoever invoked **[system.debug]**.
* Slots executed on another thread through **[fork]** are not recorded, since a fork creates its own signaler. **[join]** is recorded, but its children are not.
* Recording is turned on for the lambda passed into this slot only, and adds nothing to the execution speed of the language elsewhere.
* The recording contains a copy of the entire lambda object for every single step, so debugging a lambda that loops thousands of times produces a very large result. Recording therefore stops after 10,000 steps, and the recording's last step becomes a **[truncated]** node declaring this, rather than the recording silently ending.
