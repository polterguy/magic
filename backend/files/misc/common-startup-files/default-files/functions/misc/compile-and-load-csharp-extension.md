# Function; Compile and load C# Hyperlambda extension
FUNCTION ==> compile-and-load-csharp-extension

This function compiles C# code into a DLL byte array and loads it into the AppDomain as a Hyperlambda extension.
Your code must include a class that implements `ISlot` (or `ISlotAsync`) and is decorated with the `[Slot]` attribute.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/compile-and-load-csharp-extension.hl]:
{
  "code": "[STRING_VALUE]",
  "file": "[STRING_VALUE]",
  "assembly_name": "[STRING_VALUE]",
  "references": [
    "[VALUE_1]",
    "[VALUE_2]"
  ]
}
___
```

Arguments:

- `code` is optional C# source code.
- `file` is optional file path to a file containing C# code to be compiled.
- `assembly_name` is required DLL name (e.g. `my-slots.dll`).
- `references` is required list of assembly names already loaded into the AppDomain, such as for instance `System.Text` or `System.IO`, etc.

Example C#:

```csharp
using System;
using magic.node;
using magic.signals.contracts;

[Slot(Name = "hello")]
public class Hello : ISlot
{
   public void Signal(ISignaler signaler, Node input)
   {
      input.Value = "Hello from C#";
   }
}
```

**IMPORTANT** - You must include references for `magic.node` and `magic.signals.contracts` at minimum. And one of `file` or `code` must be supplied, but not both.

After invoking this function, your slot can be used as a Hyperlambda keyword.

## Creating Hyperlambda slots that accepts arguments

If you need to have the slot accept input arguments, and/or return multiple values to caller, you can do so using something resembling the following.

```csharp
using System;
using magic.node;
using magic.signals.contracts;

[Slot(Name = "hello2")]
public class Hello : ISlot
{
   public void Signal(ISignaler signaler, Node input)
   {
      inputAdd(new Node("result", "Hello " + input.Children.FirstOrNull(x => x.Name == "your_name").GetEx<string>()));
   }
}
```

**Notice**, slot names *must* be unique. And the slot is not persisted permanently into the cloudlet, but only kept in memory during the process lifetime. To persist it as a permanent slot that will be automatically recompiled and added to the AppDomain during recycling of the process, the C# code should be persisted inside a "magic.startup" folder, inside a module, as for instance "my-function.hl". This will ensure that the file is executed as the process starts, compiling the Hyperlambda keyword, and loading it automatically. Below is an example how this Hyperlambda file must look like.

```hyperlambda
io.file.load:/WHATEVER_FOLDER_HERE/WHATEVER_FILE_NAME_HERE.cs
system.compile
   references
      .:netstandard
      .:System.Runtime
      .:System.ComponentModel
      .:System.Private.CoreLib
      .:magic.node
      .:magic.node.extensions
      .:magic.signals.contracts
   code:x:@io.file.load
   assembly-name:WHATEVER_ASSEMBLY_NAME_HERE.dll
system.plugin.load:x:@system.compile
```

If a file loading a plugin similar to the above is found in for instance "/modules/whatever/magic.startup/my-function.hl", then that file will ensure the plugin is automatically recreated as the cloudlet reboots.
