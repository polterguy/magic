---
title: magic.lambda.sockets
---

This project provides web sockets slots for Hyperlambda.
The main idea of the project, is that it allows you to resolve Hyperlambda files, execute these,
passing in a URL and JSON arguments over a web socket connection - In addition to subscribing to messages
published by the server over a web socket connection from some client of your choosing. The project builds
upon SignalR, but the internals are completely abstracted away, and you could probably easily exchange
SignalR with any other web socket library with similar capabilities. The project contains one socket
SignalR hub method with the following signature.

```
execute(string file, string json);
```

To connect to the hub use the relative URL `/sockets`, optionally passing in a JWT token, and then
transmit messages to the hub using something such as for instance the following TypeScript.

```typescript
let builder = new HubConnectionBuilder();

this.connection = builder.withUrl('http://localhost:5000/sockets', {
    accessTokenFactory: () => 'return-your-JWT-token-here'
  }).build();

this.connection.invoke(
  'execute',
  '/foo/some-hyperlambda-file',
  JSON.stringify({
    foo:'bar'
  }));
```

The above will resolve to a Hyperlambda file expected to exist at `/modules/foo/some-hyperlambda-file.socket.hl`,
passing in the `foo` argument as lambda nodes.

## How to use [sockets.signal]

In addition to the above, you can explicitly publish SignalR events by signaling the **[sockets.signal]** slot,
which will automatically transform the specified children **[args]** nodes to JSON, and invoke the specified
method for all connections somehow subscribing to the specified method - Allowing you to filter according
to groups, users and roles if you wish. Below is an example.

```
sockets.signal:foo.bar
   roles:root, admin
   args
      howdy:world
```

The above will invoke the `foo.bar` method, passing in `{"howdy":"world"}` as a JSON string, but only users belonging
to the roles of either `admin` or `root` will be notified. Both the **[roles]** and the **[args]** arguments are optional.
To subscribe to the above invocation, you could use something such as the following in TypeScript.

```typescript
this.connection.on('foo.bar', (args: string) => {
  console.log(JSON.parse(args));
});
```

You can also signal a list of specified users, such as the following illustrates.

```
sockets.signal:foo.bar
   users:user1, user2, user3
   args
      howdy:world
```

In addition to that you can signal a list of specified groups, such as the following illustrates.

```
sockets.signal:foo.bar
   groups:group1, group2, group3
   args
      howdy:world
```

Finally, you can signal a list of specified client connections, such as the following illustrates.

```
sockets.signal:foo.bar
   clients:e6U2Zz6kqHDCEVyEX6v35w, 5uWWytAM8kJ2gfIL0fEw2A
   args
      howdy:world
```

The above will only signal the two specified client connections.

**Notice** - If you signal a group or a list of groups, you'll have to add your users to the group before
you do.

## Arguments to [sockets.signal]

* __[roles]__ - Comma separated list of roles to send message to
* __[users]__ - Comma separated list of users to send message to
* __[clients]__ - Comma separated list of client connections to send message to
* __[groups]__ - Comma separated list of groups to send message to
* __[args]__ - Arguments to transmit to subscribers as JSON (string)

Only one of **[users]**, **[roles]**, **[clients]**, or **[groups]** can be supplied, and all
the above arguments are optional.

## Publishing socket messages to groups and users

You can associate a user with one or more groups. This is done with the following slots.

* __[sockets.user.add-to-group]__ - Adds the specified user to the specified group
* __[sockets.user.remove-from-group]__ - Removes the specified user from the specified group

Below you can find an example of how to add a user to a group, for then to later de-associate
the user with the group.

```
// Associating a user with a group.
sockets.user.add-to-group:some-username-here
   group:some-group-name-here

// Publishing message, now to group, such that 'some-username-here' gets it
sockets.signal:foo.bar
   group:some-group-name-here
   args
      howdy:world

// De-associating the user with the group again.
sockets.user.remove-from-group:some-username-here
   group:some-group-name-here
```

**Notice** - SignalR users might have multiple connections. This implies that once you add a user to
a group, _all_ connections are associated with that group. The message will only be
published to connections explicitly having registered an interest in the `foo.bar` message for our
above example, irrelevant of whether the user belongs to the group or not.

## Sockets meta data

Hyperlambda also allows you to retrieve meta data about currently connected users, through for instance
the **[sockets.users]** slot and the **[sockets.users.count]** slot, that will return the username of
all currently connected users, and the count matching your specified filter condition. An example
of using it can be found below.

```
sockets.users
   filter:some-filter-condition
   offset:3
   limit:20

sockets.users.count
   filter:some-filter-condition
```

**Notice** - If a client connected anonymously somehow over a socket, the client will (obviously)
not have a username, and the default userId will be returned instead. Also please notice, that each
user might have multiple connections, and this will return each connection for each username matching
the specified filter condition.
The filter conditions and paging arguments are optional, and will be `null` and `0-10` if not specified.

## Sockets connection context

From within your Hyperlambda files executed by invoking the `execute` method, you have access to
your SignalR connectionId as a context object named _"sockets.connection"_. Below is an example of
how to retrieve the current SignalR connectionId. Notice, this only works from _within_ a socket executed
Hyperlambda file, implying only if you're executing the file using the `execute` method, through your
SignalR socket connection.

```
get-context:sockets.connection
```

This might sometimes be useful, especially if you want to dynamically add only _one_ connection to a group
for instance. To add the currently active connection explicitly to a group for instance, you can use the 
following slots.

* __[sockets.connection.enter-group]__ - Associates the current connection _only_ with the specified group
* __[sockets.connection.leave-group]__ - De-associates the current connection with the specified group

If the user has additional connections, none of the other connections will be modified in any ways. Also
realise that both of these slots can _only_ be used from within a Hyperlambda file executed through a
SignalR socket connection somehow. Below is an example.

```
// Retrieving connectionId
get-context:sockets.connection

// Entering group
sockets.connection.enter-group:x:@get-context
   group:foo-bar-group

// Do stuff here that requires the user to belong to group ...

// Leaving group
sockets.connection.leave-group:x:@get-context
   group:foo-bar-group
```

