---
title: magic.lambda.auth
---

The magic.lambda.auth project contains authentication and authorization helper slots for Magic. The project allows you
to create and consume JWT tokens, to secure your Magic cloudlet. The project contains the following slots.

* __[auth.ticket.get]__ - Returns the JWT token's payload as a lambda structure, and also verifies the token in the process
* __[auth.ticket.create]__ - Creates a new JWT token, that you can return to your client, any ways you see fit
* __[auth.ticket.refresh]__ - Refreshes a JWT token. Useful for refreshing a token before it expires, which would require the user to login again
* __[auth.ticket.verify]__ - Verifies a JWT token, and that the user is logged in, in addition to (optionally) that he belongs to one of the roles supplied as a comma separated list of roles
* __[auth.ticket.in-role]__ - The same as **[auth.ticket.verify]**, but returns true or false, depending upon whether or not user is in any of the roles provided or not
* __[auth.token.verify]__ - This slot accepts an external OpenID Connect token, for then to verify its authenticity and returning its email claim.

Notice, you will have to modify your `auth:secret` configuration setting, to provide a unique salt for your installation.
If you don't do this, some adversary can easily reproduce your tokens, and impersonate your users. Example of
an _"appsettings.json"_ secret you could apply can be found below (don't use the exact same salt, the idea is to provide
a _random_ salt, unique for _your_ installation)

However, during installation, Magic will automatically create a random secret for you. Below is an example of how this
might look like.

```
{
  "auth": {
    "secret":"some-rubbish-random23545456-characters-goes-hereqwertygfhdfSDFGFDdfgh45fDFGH"
  }
}
```

The idea is that your `SymmetricSecretKey` is based upon the above configuration setting, implying you should keep it
safe the same way you'd keep the pin code to your ATM card safe.

Below is an example of how to create a new JWT ticket.

```
auth.ticket.create
   username:foo
   roles
      .:howdy
      .:world
```

The above will return something resembling the following, minus the carriage returns, which are added for clarity.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImZvbyIsInJvbGUiOlsiaG93ZHkiLCJ3b3Js
ZCJdLCJuYmYiOjE2MTc5NDQyMzYsImV4cCI6MTYxNzk1MTQzNiwiaWF0IjoxNjE3OTQ0MjM2fQ.
9eYROea_r-TJGT5k4H0DaGDW6LziHhEsK4on-uc-ECc
```

Typically Magic takes care of authentication for you, by exposing an `authenticate` endpoint for
you, where you can submit a username and a password, for then to have your JWT token returned accordingly.
You can also associate any claims you wish with your JWT token, by adding a key/value **[claims]**
argument to your invocation as you create your JWT token. Below is an example.

```
auth.ticket.create
   username:foo
   roles
      .:howdy
      .:world
   claims
      id:578
      ssid:xyzqwerty67
```

All additional (non-roles) claims will have their values converted to string though, which is more of a restriction
from .Net and the JWT standard than a restriction of Magic.

**Notice** - Also notice that if you create a JWT token with a user belonging to _only one role_, the roles claims
will _not_ be an array, but simply a string. Yet again, this is simply how .Net works, and there is little we can do
about this. Hence, remember to check in your frontend as you retrieve your roles if the roles claims is a string
or an array of strings before associating your user with a role in your client logic.

When you invoke **[auth.ticket.create]** or **[auth.ticket.refresh]** you can choose to either provide an **[expires]** which is a future date for when the ticket expires, or a **[duration]** which is a positive integer informing the slot of how many minutes the token should last before it's no longer valid.

## JWT tokens internals

A JWT token is actually just 3 JSON objects, that have been base64 encoded, and afterwards each entity is separated
by a period (.). In fact, you can inspect a JWT token at for instance [JWT.io](https://jwt.io) to inspect its internals.
A JWT token has 3 parts.

* The header providing meta information
* The payload being the actual data of the token
* The signature which is basically just a HASH based upon your token's payload, salted with your auth secret

Unless an adversary knows your auth secret, it becomes impossible to create a valid JWT token. However, your token
is still vulnerable for being stolen, so make sure you only return it over a secure HTTP connection.

## Using your JWT token

Magic expects the token to be specified as a `Bearer` token in your HTTP invocation's `Authorization` HTTP header.
To use the token therefore implies adding an HTTP `Authorization` header, and setting its value to something resembling
the following.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.qwerty
```

You can see how Magic does this internally by inspecting what the Magic dashboard transmits to the backend
after having authenticated using e.g. Chrome Developer Tools.

## Refreshing your JWT token

JWT tokens have an expiration date. This is typically configured in your _"appsettings.json"_ file in your Magic
backend as `magic:auth:valid-minutes`, and once this time has passed, the token will no longer be considered
valid, and using the token after this period, will result in an _"Access Denied"_ being returned from the server.

However, since JWT token are just JSON, and the expiration time is just a Unix timestamp, you can parse the
JWT token in your frontend, calculate the expiration date, and make sure you refresh your token _before_ the
expiration date is reached, and replace your existing token with the new token returned by Magic.

Magic contains a `refresh` token endpoint to achieve this. Internally this endpoint will use
the **[auth.ticket.refresh]** slot to create a new token, where the only difference between your old and your
new token is that it has a new expiration date.

## Securing your endpoints

To secure an endpoint, and for instance require the user to belong to a specific role in order to be allowed
to invoke an endpoint, you might add something such as the following to the top of your Hyperlambda files.

```
auth.ticket.verify:root, admin, user
```

The above will throw an exception unless the endpoint is given a valid JWT token, and the user belongs to
one of the roles that you pass in as a comma separated list of roles in its invocation. In fact, you can try
this out, by pasting the following into your Hyperlambda evaluator in your dashboard and execute it.

```
auth.ticket.verify:non-existing-role
```

## Inspecting your JWT token's payload

The following slots allow you to inspect the token's payload, implying get the username and roles
the current HTTP request originates from.

* __[auth.ticket.get]__ - Returns the username and the roles the user belongs to
* __[auth.ticket.in-role]__ - Convenience slot returning true if user belongs to the specified role(s)

Below is an example of how these are used.

```
auth.ticket.in-role:foo, root
auth.ticket.get
```

The first slot returns _true_ because your root user belongs to _one_ of the roles you supplied as
a comma separated list of roles. The second slot above returns the username, and all the roles the user
belongs to as a structured lambda object. As a general rule of thumb though, you'd not want to secure your
endpoints using the above slots, but rather the _verify_ slot above, to avoid having errors in your code
resulting in that an unauthorized user gains access to invoke an endpoint he should not be allowed to invoke.
The **[auth.ticket.get]** slot will also return any custom claims you have associated with your JWT token
as it was created.

## How to use [auth.ticket.get]

This slot returns the currently authenticated user, its roles, and what claims the user has. Below is example
usage. The slot returns the username as the value of its invocation and the roles as a **[roles]** list.

```
auth.ticket.get
```

Like all auth related slots, it only makes sense to invoke from within a context of having an authorised
user, such as an HTTP endpoint intended to be invoked by an authenticated user.

## How to use [auth.ticket.create]

This slot creates a new JWT token for you, and accepts a username and optionally a list of roles. Below
is some example usage.

```
auth.ticket.create
   username:foo
   roles
      .:howdy
      .:world
```

Like all auth related slots, it only makes sense to invoke from within a context of having an authorised
user, such as an HTTP endpoint intended to be invoked by an authenticated user.

## How to use [auth.ticket.refresh]

This slot returns a new JWT token from an old existing (and valid) token. However, the new token will
have a new expiration date, further into the future, allowing you to create a timer that occasionally
invokes the server to create a new token, preventing the user from being logged out due to having his
or her JWT token becoming expired.

```
auth.ticket.refresh
```

Like all auth related slots, it only makes sense to invoke from within a context of having an authorised
user, such as an HTTP endpoint intended to be invoked by an authenticated user.

## How to use [auth.ticket.verify]

This slot verifies that the currently authenticated user belongs to one or more roles provided as
a comma separated list of names. If the user does not belong to any of the specified roles, the
slot will throw an exception. Below is example usage.

```
auth.ticket.verify:root,admin,guest
```

Like all auth related slots, it only makes sense to invoke from within a context of having an authorised
user, such as an HTTP endpoint intended to be invoked by an authenticated user.

## How to use [auth.ticket.in-role]

This slot verifies that the currently authenticated user belongs to one or more roles provided as
a comma separated list of names. Contrary to the **[auth.ticket.verify]** slot this slot will _not_
throw an exception if the user does not belong to one or more roles, but simply return false.
Below is example usage.

```
auth.ticket.in-role:root,admin,guest
```

Like all auth related slots, it only makes sense to invoke from within a context of having an authorised
user, such as an HTTP endpoint intended to be invoked by an authenticated user.

## OpenID Connect [auth.token.verify]

This slot accepts an external token created by OpenID Connect providers, and verifies the token's authenticity, and throws an exception if the token is not valid. If the token is valid it will return the **[email]** claim and the **[name]** claim if existing, in addition to **[nonce]** if existing - But it will not return anything else. The slot requires the following argument.

* __[token]__ - Being the actual token as created by the OIDC provider.

Example usage.

```text
auth.token.verify
   token:SOME_JWT_TOKEN_HERE
```

The slot will download well known configurations automatically, in addition to signing keys, which it will use to verify the token. Notice, the slot will accept all issuers by default, but it will return the issuer as **[issuer]** allowing you to check in your code if you trust the issuer or not after having invoked the slot before you generate an application specific token to return to the client.
