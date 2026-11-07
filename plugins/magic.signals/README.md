---
title: magic.signals
---

magic.signals is a _"Super Signals"_ implementation for .Net 8 built on top of magic.node,
allowing you to invoke functions from one assembly in another assembly without having any direct references between
your projects.

## Active Events or Super Signals internals

Zero cross project references is made possible by always having a YALOA, allowing us to invoke methods in classes through
a _"magic string"_, which references a type in a dictionary, where the string is its key, and the types
are dynamically loaded during startup of your AppDomain. Imagine the following code.

```csharp
[Slot(Name = "foo.bar")]
public class FooBar : ISlot
{
    public void Signal(ISignaler signaler, Node input)
    {
        input.Value = 42;
    }
}
```

The above declares a _"slot"_ for the signal **[foo.bar]**. In any other place in our AppDomain we can use an `ISignaler`
instance to Signal the above slot by using something such as the following.

```csharp
/*
 * This will invoke our Signal method above
 */
var args = new Node();
signaler.Signal("foo.bar", args);

/*
 * The value of args is now 42.
 */
Assert.Equal(42, args.Value);
```

Notice that there are no shared types between the invoker and the handler, and there are no references necessary to
be shared between these two assemblies. This results in an extremely loosely coupled plugin architecture, where you can
dynamically add any plugin you wish into your AppDomain, by simply referencing whatever plugin assembly you
wish to bring into your AppDomain, and immediately start consuming your plugin's functionality - Or dynamically loading
it during runtime for that matter, resulting in that you instantly have access to its slots, without needing to create
cross projects references in any ways.

This results in an extremely loosely coupled architecture of related components, where any one component can easily be
exchanged with any other component, as long as it is obeying by the implicit interface of the component you're replacing.
Completely eliminating _"strongly typing"_, making interchanging components with other components equally simply in a
static programming language such as the .Net CLR as providing a function object in JavaScript.

In many ways, this
results in having all the advantages from a functional programming language in a static programming language, while still
keeping the strongly typing around for cases where you need strongly typing - Allowing you to choose which paradigm you
want to use, based upon individual use cases, and not having the language and platform dictate your choices in these
regards.

The magic.signals implementation uses `IServiceProvider` to instantiate your above `FooBar` class when it
wants to evaluate your slot. This makes it behave as a good IoC citizen, allowing you to pass in for instance
interfaces into your constructor, and have the .Net dependency injection automatically create objects
of whatever interface your slot implementation requires.

There is also an `async` version of the interface, which allows you to declare async slots, transparently
letting the runtime choose which implementation to use, depending upon whether or not it is currently in
an `async` execution context or not. Below you can see how to accomplish the same as above, except this
time the slot will be invoked within an `async` context.

```csharp
[Slot(Name = "foo.bar")]
public class FooBar : ISlotAsync
{
    public Task SignalAsync(ISignaler signaler, Node input)
    {
        input.Value = 42;
        await Task.Yield();
    }
}
```

It's a common practice to implements slots that recursively invokes other slots, by combining the above two constructs, into
one single class. Below is an example.

```csharp
[Slot(Name = "foo.bar")]
public class FooBar : ISlot, ISlotAsync
{
    // Sync version.
    public void Signal(ISignaler signaler, Node input)
    {
        input.Value = 42;
    }

    // Async version.
    public async Task SignalAsync(ISignaler signaler, Node input)
    {
        input.Value = 42;
        await Task.Yield();
    }
}
```

The above simple example is probably not that useful to implement as an `async` slot, but for other parts of your code,
where you for instance are accessing sockets, HTTP connections, or the file system for that matter - Creating
async slots will have huge advantages for your application's ability to scale, and handle multiple simultaneous
users and connections. The runtime will _"automagically"_ choose the correct implementation, being synchronous or
asynchronous, depending upon which execution context the execution object currently is within.

If your slots recursively invokes other slots, by for instance invoking `signaler.Signal("eval", args)`, you should
also implement the `async` interface, to allow for children lambda objects to be within an async context. This has huge
advantages for your application's throughput.

## Passing arguments to your slots

The Node class provides a graph object for you, allowing you to automagically pass in any arguments you wish.
Notice, the whole idea is to de-couple your assemblies, hence you shouldn't really pass in anything but native types,
such as for instance `System.String`, `System.DateTime`, integers, etc. However, most complex POD structures, can also
easily be represented using this `Node` class.

The Node class is basically a name/value/children graph object, where
the value can be any object, the name a string, and children is a list of children Nodes. In such a way, it provides
a more C# friendly graph object, kind of resembling JSON, allowing you to internally within your assemblies, pass
in a Node object as your parameters from the point of your signal, to the slot where you handle the signal.

The `Node` POCO class again, is a bi-directional POD instance, allowing you to both pass arguments _into_ the
slot, in addition to having the slot _return_ values back to the caller.

If you invoke `Signal` or `SignalAsync` from C#, you can optionally pass in a function object that will
be executed after the signal has been executed. This is useful for cases where you're creating an async signal
invocation, but not invoking it immediately, and rather returning it as a `Task` to some other parts of your
system, to ensure something occurs _after_ the signal has been executed. Below is an example.

```csharp
var args = new Node();
return signaler.SignalAsync("foo.bar", args, () => { /* ... This will happen AFTER execution of signal ... */ });

```

## Execution scoped context

magic.signals also provides the low level runtime pieces required for execution scoped cancellation.
An execution can carry ambient state through the signaler stack, allowing C# slots to retrieve the
current execution context from `ISignaler` without changing every method signature in the system.

The current execution context can be retrieved in C# using the helper extensions in this project.

```csharp
var execution = signaler.GetExecutionContext();
var token = signaler.GetCancellationToken();
signaler.ThrowIfCancelled();
```

An execution context contains the execution id, cancellation token, reference counting for forked
work, and optional deadline tracking for execution timeouts. This allows one request to cancel a
different in-flight request by id, while still allowing child threads to share the same execution
state safely.

Hyperlambda does not receive the raw execution object. Instead, higher layers may expose selected
values such as the execution id through ordinary context values such as `dynamic.execution-id`,
allowing code to use existing helpers such as **[get-context]** without exposing internal runtime
objects.

## Slots a whitelist can never name

A **[whitelist]** restricts the slots a piece of Hyperlambda can invoke, which is how a sandboxed caller is given
a small vocabulary. A slot that would hand that caller the host itself, such as running a command, loading code,
minting a ticket or reading secrets, declares so on its `[Slot]` attribute

```csharp
[Slot(Name = "system.execute", Whitelistable = false)]
```

`Whitelistable` defaults to `true`. A **[whitelist]** whose **[vocabulary]** names a slot declaring `false` is
refused when it is created, with `[system.execute] can never be used inside a [whitelist]`. It is declared per slot
name, so a class declaring several slots can mark only some of them. The declaration is read once at startup by the
`ISignalsProvider`, never while slots are invoked.

Notice, this only limits what a **[whitelist]** can grant. A trusted file invoked with **[execute-file]** runs
without the whitelist, so it still calls whatever slots it needs.

## Magic Signals a DSL

A lot of the idea behind Magic Signals is that combined with magic.node,
and especially its ability to parse Hyperlambda, it becomes a very good foundation for a DSL, or a Domain Specific
programming Language implementation, allowing you to easily create your own programming languages, and keywords,
based upon Hyperlambda syntax trees. Hyperlambda in this context being the textual representation of your `Node`
hierarchy.
