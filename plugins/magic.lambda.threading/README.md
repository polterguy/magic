---
title: magic.lambda.threading
---

This project contains all thread related slots for Hyperlambda. Threading in software development implies
doing multiple things concurrently, scheduling CPU time for each of your threads, creating the illusion
of having your computer doing multiple times concurrently. This concept is often referred to as
_"multi tasking"_ and is crucial for any modern operating system, and/or programming language.
Hyperlambda contains several multi tasking related slots.

* __[fork]__ - Executes lambda in a separate thread pool work item
* __[join]__ - Waits for descendant forks to complete
* __[semaphore]__ - Synchronizes concurrent access to shared resources
* __[sleep]__ - Suspends the current execution for a number of milliseconds
* __[execution.kill]__ - Cancels another running execution by its execution id
* __[execution.timeout]__ - Configures a timeout for the current execution context
* __[execution.throttle.create]__ - Creates, replaces or deletes a named throttle
* __[execution.throttle]__ - Enforces a named throttle, rate limiting invocations

## How to use [fork]

Forks the given lambda into a new thread of execution, using a thread from the thread pool. This
slot is useful for creating _"fire and forget"_ lambda objects, where you don't need to wait
for the result of the execution before continuing executing the current scope.

```
fork
   info.log:I was invoked from another thread
```

To understand how **[fork]** works, you can imagine your computer's CPU as a single river,
running down hill, and at some point the river divides into two equally large rivers. This is
referred to as _"a fork"_. The analogy of the river becomes important for another reason, which
is the understanding of that the total amount of water is still the same, it's only parted
into two smaller rivers - Implying you cannot _"do more"_ with multi tasking, you can only
equally share the same amount of resources as you had before between two different tasks.
Multi threading does not make your CPU faster, it only schedules your CPU's time on multiple
things, doing these things concurrently. However, if you have multiple tasks where each
individual task needs to wait for IO data, threading typically speeds up your application,
since it can make multiple requests for IO simultaneously, and have other machines, and/or
processes working in parallel.

## How to use [join]

Joins all child **[fork]** invocations, implying the slot will wait until all forks directly below it
has finished executing, and automatically copy the result of the **[fork]** into the original node.

```
join
   fork
      http.get:"https://servergardens.com"
   fork
      http.get:"https://gaiasoul.com"
```

As an analogy for what occurs above, imagine the two rivers from our above **[fork]** analogy
that forked from one larger river into two smaller rivers, for then again to join up and becoming one
large river again further down.

## How to use [semaphore]

Creates a named semaphore, where only one thread will be allowed to evaluate the same semaphore at
the same time. Notice, the semaphore to use is defined through its value, implying you can use the same
semaphore multiple places, by using the same value of your **[semaphore]** invocation.

```
semaphore:foo-bar
   /*
    * Only one thread will be allowed entrance into this piece of
    * code at the same time, ensuring synchronized access, for cases
    * where you cannot allow more than one thread to enter at the
    * same time.
    */
```

In the above semaphore _"foo-bar_" becomes the name of your semaphore. If you invoke **[semaphore]** in
any other parts of your Hyperlambda code, with _"foo-bar"_ as the value, only _one_ of your
lambda objects will be allowed to execute at the same time. This allows you to _"synchronize access"_
to shared resources, where only _one_ thread should be allowed to access the shared resource at the same
time. Such shared resources might be for instance files, or other things shared between multiuple threads,
where it's crucial that only one thread is allowed to access the shared resource at the same time.

## How to use [sleep]

This slot will sleep the current thread for x number of milliseconds, where x is an integer value, expected
to be passed in as its main value.

```
// Sleeps the main thread for 1 second, or 1000 milliseconds.
sleep:1000
```

**Notice** - This slot is typically releasing the thread back to the operating system, implying as
the current thread is _"sleeping"_, it will not be a blocking call, and require ZERO physical operating
system threads while it is sleeping. This is true because of Hyperlambda's 100% perfectly `async` nature.

## How to use [execution.kill]

Cancels another running execution by its execution id. This is useful when you have previously returned
an execution id to a caller and later want to stop that execution from another request or thread.

```
execution.kill:6c5a0bd3f7d64d6382d6cf3e7df5dc7c
```

The slot returns a boolean value indicating whether or not a matching live execution was found and
cancelled.

## How to use [execution.timeout]

Configures a timeout for the **current** execution context. The value must be a positive number of
milliseconds and is interpreted relative to _now_.

```
execution.timeout:30000
```

The above means the current execution may continue for at most 30 more seconds. The slot returns a
boolean value indicating whether or not the timeout actually tightened the current deadline.

If multiple timeouts are applied to the same execution, the earliest deadline wins. Any child work
created through **[fork]** inherits the same execution context, implying the timeout applies to
forked work too.

## How to use [execution.throttle]

Rate limiting is split into two slots; **[execution.throttle.create]** _declares_ a named throttle,
being the single source of truth for its configuration, while **[execution.throttle]** _enforces_ it,
throwing an exception with a 429 status code once the limit is exceeded. Declaring a throttle whose
configuration is unchanged is a no-op that keeps the existing counters, implying you can safely
declare a throttle directly at the top of your endpoint file, immediately before enforcing it.

```
// At the top of your endpoint file, allowing 10 invocations per user per minute.
execution.throttle.create:my-endpoint
   limit:10
execution.throttle:my-endpoint
```

For a throttle shared between multiple endpoints you typically declare it once in a file inside
your module's _"magic.startup"_ folder instead, ensuring it exists when your module loads, and
enforce it with a single line of code in each endpoint sharing the budget.

```
// In your module's magic.startup folder.
execution.throttle.create:openai-budget
   limit:100
   window:3600
   per:global
```

```
// At the top of every endpoint sharing the above budget.
execution.throttle:openai-budget
```

The name is the identity of your throttle, and works the same way as the name of a **[semaphore]** -
all **[execution.throttle]** invocations using the same name share _one_ rate limit, allowing you to
enforce the same throttle in multiple endpoints to give a group of endpoints a shared budget, or use
a unique name per endpoint to rate limit each endpoint individually.

Psst, to create a unique name you can copy the endpoint filename and use it as name.

**[execution.throttle.create]** takes the following arguments.

* __[limit]__ - Maximum number of invocations allowed per window, mandatory when creating
* __[window]__ - Window length in seconds, defaults to 60
* __[per]__ - How to partition the limit, being one of _'user'_, _'ip'_ or _'global'_

**[per]** being _'user'_ counts invocations per authenticated username, and throws a 401 exception
for anonymous callers. _'ip'_ counts per client IP address, and _'global'_ shares one single limit
between all callers. If you omit **[per]** entirely, the limit is counted per username when the
caller is authenticated, and per IP address otherwise, which is typically what you want. When
resolving the client IP address, the slot prefers CloudFlare's `CF-Connecting-IP` request header
when it exists, since behind CloudFlare the raw connection IP resolves to the proxy and not to the
client, and only falls back to the connection IP when the header is absent.

The limit is a _fixed window_, implying `limit:50` with `window:60` allows exactly 50 invocations
per minute, with the counter resetting when the window expires. Rejected invocations are told how
many seconds remain before the window resets as part of the exception message.

Invoking **[execution.throttle.create]** with the name of an already existing throttle but a
_different_ configuration _replaces_ the throttle, the same way **[slots.create]** replaces an
already existing dynamic slot, also resetting its counters - while an _identical_ configuration
leaves the existing throttle untouched. Invoking it _without_ any arguments _deletes_ the throttle
instead, the same way **[cache.set]** without a value deletes the cached item.

```
// Deletes the throttle entirely.
execution.throttle.create:openai-budget
```

**[execution.throttle]** accepts _only_ a name - passing it any arguments throws an exception,
since configuration belongs exclusively to **[execution.throttle.create]**. Enforcing a throttle
that has not been declared also throws an exception, since this implies your endpoint expects a
rate limit that does not exist.
