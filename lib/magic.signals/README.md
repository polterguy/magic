
# Magic signals

This is where the signal/slot or _"Super Signal"_ implementation can be found. A signal, is an untyped
method invocation, allowing you to pass in a JObject, which again results in the ability to invoke methods
from one module to another module, without any of the modules needs to reference each other. This facilitates
for an extremely loosely coupled design, where your modules in no ways needs to reference each other in any
ways.

Example usage can be found below.

```csharp
using System;
using magic.signals.contracts;

[Slot(Name = "foo.bar")]
public class FooBarSlot : ISlot
{
    public void Signal(JObject input)
    {
        var foo = input["foo"].Value<Guid>();
        /* ... do stuff with foo here ... /*
    }
}
```

Then somewhere else in your application, in a completely different module, you can do the following.

```csharp
using System;
using magic.signals.contracts;

public class FooBarSignaler
{
    readonly ISignaler _signaler;

	// "signaler" is passed in through dependency injection.
    public FooBarSignaler(ISignaler signaler)
    {
        _signaler = signaler;
    }

    public void DoFooBar(Guid foo)
    {
        _signaler.Signal("foo.bar", new JObject
        {
            ["foo"] = foo,
        });
    }
}
```

