---
title: magic.lambda.caching
---

This project contains caching helper slots for Hyperlambda. More specifically this project provides the following slots.

* __[cache.set]__ - Adds the specified item to the cache
* __[cache.get]__ - Returns a previously cached item, if existing, if not returns nothing
* __[cache.try-get]__ - Attempts to retrieve an item from cache, and if not existing, invokes __[.lambda]__ to create item, saves the resulting item to the cache, before returning the item to caller
* __[cache.clear]__ - Completely empties cache, optionally taking a filter condition
* __[cache.list]__ - Lists all items in cache, optionally taking a filter condition
* __[cache.count]__ - Returns the number of cache items in total, optionally taking a filter condition

All of the above slots requires a key as its value, and/or a filter argument, as the value of the identity node
for the invocation of the slot. Notice, the cache can _only_ persist string values, implying if you want to store
something else besides a string, you'll need to correctly convert the object before storing it into your cache,
and correctly convert it after extracting it again later. If you need to preserve typing information, you can
store Hyperlambda strings into your cache.

## How to use [cache.set]

Invoke this slot to save an item to the cache. The slot takes 3 properties, which are as follows.

* Value of node, being the _key_ for your cache item.
* __[value]__ - The item to actually save to the cache. If you pass in null, any existing cache items matching your key will be removed
* __[expiration]__ - Number of seconds to keep the item in the cache. Defaults to 5

Below is an example of a piece of Hyperlambda that simply saves the value of _"Howdy world"_ to your
cache, using _"cache-item-key"_ as the key for the cache item.

```
cache.set:cache-item-key
   expiration:5
   value:Howdy world
```

To remove the above item, you can use the following Hyperlambda.

```
cache.set:cache-item-key
```

## How to use [cache.get]

Returns an item from your cache, or null if there are no items matching the specified key. Below is an
example of retrieving the item we saved to the cache above.

```
cache.get:cache-item-key
```

## How to use [cache.try-get]

This slot checks your cache to look for an item matching your specified key, and if not found, it will
invoke its **[.lambda]** argument, and save its returned value to the cache with the specified key,
before returning the created item to caller.

```
cache.try-get:cache-key
   expiration:5
   .lambda
      return:Howdy world
```

If you are using the default memory based cache, then this slot is implemented in such a way that
only the first invocation towards the specified key will actually execute your **[.lambda]** object,
allowing you to have very expensive executions to create your items, that you want to store into
the cache, without experiencing race conditions, or having more than one thread actually create the
item and store into the cache. Notice, this is _not_ true if you are using an out of process cache
implementation, such as the one found in the _"magic.data.cql"_ project. This should in general be
your _"goto slot"_ whenever you want to use the cache slots in this project.

## How to use [cache.clear]

This is a shorthand slot to completely clear cache, removing all items.

```
cache.set:cache-item-key
   expiration:5
   value:Howdy world

cache.clear
cache.get:cache-item-key
```

Notice, the above Hyperlambda should not return any item in its last invocation to **[cache.get]**
since the cache was cleared before invoking it. The slot also optionally takes a filter argument
as its value, which if provided, will _only_ delete items starting out with the specified filter.
Usage example can be found below.

```
cache.clear:foo.bar
```

The above will _only_ remove cache items having a key that starts out with _"foo.bar"_ implying
that for instance the following items will be cleared.

* foo.bar
* foo.bar.xyz1
* foo.bar.xyz2

While an item with a key of _"x.foo.bar"_ will _not_ be removed. This allows you to _"namespace"_
your cache items, and clearing out for instance all cache items matching the specified namespace
in one invocation.

## How to use [cache.list]

Lists all items in cache, and returns to caller.

```
cache.set:cache-item-key
   expiration:5
   value:Howdy world
cache.list
```

This slot also supports the following optional arguments.

* __[limit]__ - Maximum number of items to return.
* __[offset]__ - Offset of where to start returning items.
* Filter as value of node being the filter condition declaring which items to return. See the __[cache.clear]__ slot to understand how it works, since this argument works in the exact same way, assuming your filter is a _"namespace"_.

## How to use [cache.count]

This slot works similarly to the **[cache.list]** slot, except it only returns the number of items.
Below is an example of creating a new cache entry, for then to count how many cache items exists
in your cache.

```
cache.set:cache-item-key
   expiration:5
   value:Howdy world
cache.count
```

## Hyperlambda caching internals

Internally the cache implementation is _not_ using the `MemoryCache` from .Net, since this class
suffers from a whole range of problems in regards to its API, such as not being able to count or
iterate items, etc. Hence, the actual implementation is _completely custom_, and is based upon
the `IMagicCache` interface, which by default is wired up towards its `MagicMemoryCache`
implementation. This is a conscious choice, since first of all the `IMemoryCache` that .Net
provides out of the box is _really_ slow, in addition to that it is missing a _lot_ of crucial
parts expected from a mature memory based cache implementation.

If you want to access the actual cache from C# or something, make sure you use it through the dependency
injected `IMagicCache` interface, providing you with the implementation class needed to consume
it from C#. This interface has a lot of nifty methods you can use to have a robust and fast memory
based cache implementation in your C# code. However, _it is a memory based cache_. If you need better
caching features going beyond what a basic memory based cache implementation can achieve, you might
want to use the out of process based cache that can be found in the project called _"magic.data.cql"_.
The latter allows for storing cache items in Cassandra or ScyllaDB.

If you consume the `IMagicCache` interface from your own C# code, you can create _"hidden"_
cache items that are only possible to retrieve from C# code and not from Hyperlambda. This allows
you to create a C# only type of cache, where items added as hidden cannot in any ways what so ever
be retrieved from Hyperlambda. This is useful for C# only type of cache items that you don't want to
expose to Hyperlambda code. The _"magic.lambda.slots"_ project for instance is internally storing its
dynamically created slots in the cache as _"hidden"_ items.
