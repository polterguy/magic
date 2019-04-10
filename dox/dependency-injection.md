# What is Dependency Injection

Dependency Injection is a design pattern that allows you to separate implementation details of components and usage of those same components.
DI allows you to easily exchange your implementation later if you need it. In such a way, it further increases encapsulation
of your code, and creates less dependencies than what you'd have without DI. One of the better libraries for implementing DI
today in C# is [Ninject](http://www.ninject.org/). Parts of the examples here, comes from the Ninject website.

DI is based upon interfaces and a _"trick"_ of creating objects, where you never create your objects directly, but rather
use some sort of YALOA (Yet Another Layer Of Abstraction) to create objects implementing your logic. Imagine the following code.

```csharp
public class Samurai
{
    public Samurai(IWeapon weapon)
    {}
}
```

In our above code, we have a class `Samurai` that needs an `IWeapon` as its constructor argument. We could of course
simply create our Samurai using something such as the following ...

```csharp
// Assuming Sword implement IWeapon!
var s = new Samurai(new Sword());
```

... however, if we do, we have accomplished little. Sure, we no longer have a Samurai class dependent upon Sword as
the implementation, but if we want to exchange Sword with `BattleAxe` later, we'll have to wade through every single place
where we instantiate our Sumarais, and exchange the code that creates our Samurais. A much more intelligent approach
is suggested by Dependency Injection, where we can _indirectly_ create our Samurais, and allow for our DI library to
decide which type of weapon our Samurais should have. This can be accomplished using something such as the following.

```csharp
var s = kernel.Get<Samurai>();
```

Then in some other parts of our code, we have told Ninject that every time we need a Samurai, it should automatically
use `Sword` as the weapon argument as it creates our Samurai. This allows us to later exchange one line of code, to
automatically have all Samurais start using `MachineGun`s as we reach modern times. The way we would normally do this,
is as follows.

```csharp
// Creating our Ninject kernel
var kernel = new StandardKernel();

// Binding IWeapon to the Sword class.
kernel.Bind<IWeapon>().To<Sword>();

// Binding our Samurai class to "self".
kernel.Bind<Samurai>().ToSelf();
```

With the above code, we can create a new Samurai with the following code, assuming we are able to access the same `StandardKernel` instance
that we have configured above.

```csharp
var s = kernel.Get<Samurai>();

// "s" above is now created with a "Sword" as its weapon.
```

At this point, the only thing we need to do, is to make sure we somehow can globally access the same _"kernel"_ as the one we have configured
in our above code, which can be accomplished by for instance wrapping our kernel inside a _"Singleton"_ class. The `kernel` hence becomes
the only commonly shared type between our `Sword` and our `Samurai`. The kernel hence becomes a _"YALOA"_ service for us, or _"Yet Another Layer
Of Abstraction"_, always allowing us to in the future exchange our dependencies, without having to wade through thousands of lines of code.

## Examples

In [Magic](https://github.com/polterguy/magic) I am heavily using DI, such as for instance when I execute some HTTP REST endpoint, I
am allowing Ninject to instantiate my controllers, passing in whatever implementation of my interfaces as I have configured Ninject in some
other parts of my app to use. [This code for instance](https://github.com/polterguy/magic/blob/v2.2/modules/magic.todo/magic.todo.web.controller/TodosController.cs)
will be invoked with an `ITodoService` instance. My [TODO service](https://github.com/polterguy/magic/blob/v2.2/modules/magic.todo/magic.todo.services/TodoService.cs)
implements this interface, and I configure Ninject to bind between my interface and my implementation 
class [here](https://github.com/polterguy/magic/blob/v2.2/modules/magic.todo/magic.todo.services/init/ConfigureNinject.cs#L17).

The places where I do these different parts are important to understand, if you want to create truly modular code. For instance, in the same
project as I implement my `TodoService` I also bind between my `ITodoService` interface and my `TodoService` implementation. This allows
me to simply drop using the entire project, create a new project, and replace the DLL with my new DLL implementing `ITodoService`, without 
having to do anything else. I could also have chosen to implement this even 100% dynamically, by for instance associating my interfaces
with implementation classes in some configuration file, and dynamically binding between interfaces and implementations as I start my app,
by reading the configuration file, which could contain things such as.

```xml
<add key="ITodoService" value "TodoService" />
```

However, for my particular use case above, creating my association in my service assembly, is sufficient, and reduces complexity. Always
choose the road of _"least amount of resistance and complexity"_ to avoid _"astronaut architecture"_.

## Advanced

Ninject implements everything you can imagine when it comes to the DI design pattern. Personally I prefer it by a mile in favour of the
internal DI libraries from .Net Core. For instance, Ninject allows me to create _"named"_ resolvers, where I can have multiple implementations,
and where my implementation is selected according to some attibute I supply where I need access to some specific implementation. A good example
here is how I need two different implementations for my database `ISession` objects from NHibernate, depending upon whether or not I need 
access only for the duration of some HTTP request, or if I have a background thread going towards my database. To differentiate between these
two concepts is important, since in an HTTP request, I want Ninject to automatically `Dispose` my `ISession` when the HTTP request is
finished. While in my background worker thread, I need to control the life cycle of my `ISession` myself, and if I didn't separate
these two different ways of using my `ISession` objects, I would risk having Ninject dispose my session, before I was done using it in my
background threads. Hence, I can configure two different `ISession` values, both sharing the actual implementation, with the difference that
my HTTP requests will get a session that is automatically disposed when the request is finished, while my background threads retrieves a
session where they themselves needs to dispose the session. This is done by configuring
Ninject [as follows](https://github.com/polterguy/magic/blob/v2.2/magic.backend/init/InitializeDatabase.cs#L39).

Notice how I `Bind` my `ISession` interface twice, passing in a different _"name"_ for each of these places. To simplify the code, it
would end up looking like the following.

```csharp
// One binding
kernel.Bind<ISession>()
    .ToMethods((ctx) => /* some method that creates a session */)
	.Named("some-unique-name"); // This is the important parts!

// Another binding
kernel.Bind<ISession>()
    .ToMethods((ctx) => /* ... */)
	.Named("some-OTHER-unique-name");
```

I now have to distinctly different bindings, that could also return two completely different implementations, and I could use
them such as the following illustrates.

```csharp
// Using the first binding from above.
public class Foo
{
    // Making sure we will be given the first implementation from above.
    public Foo([Named("some-unique-name")] ISession session)
    { }
}

// Using the SECOND binding from above.
public class Bar
{
    // Making sure we will be given the first implementation from above.
    public Bar([Named("some-OTHER-unique-name")] ISession session)
    { }
}
```

## Wrapping up

So basically, the idea with dependency injection (DI), is to allow you to decouple the implementation details of your components,
from the places where you consume/use these components, by encapsulating your implementation details behind some interface, and
using YALOA to instantiate your objects, in such a way that you don't need to inject the dependencies to your objects yourself,
but can allow your DI library to automatically do this for you.

**USE IT!!**

