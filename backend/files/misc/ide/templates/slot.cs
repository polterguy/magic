
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
        input.Value = $"Hello from C# {input.GetEx<string>()}";
    }
}
