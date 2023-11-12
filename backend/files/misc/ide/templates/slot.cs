// Example C# code creating a Hyperlambda slot.
using System;

using magic.node;
using magic.node.extensions;
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
        input.Value = $"Hello {input.GetEx<string>()} your SMTP server is {configuration["magic:smtp:host"]}";
    }
}
