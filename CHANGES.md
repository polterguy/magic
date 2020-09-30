
# Version 8.1.20

## magic.endpoint

Added support for retrieving request HTTP headers, using the following two slots.

* __[request.headers.get]__ - Returns the value of the specified HTTP request header
* __[request.headers.list]__ - Returns the key/value of all HTTP request headers

**Breaking changes** - Also renamed the HTTP response manipulation slots, removing the _"http."_ prefix.
This might render existing Hyperlambda files incompatible, at which point you'll have to
rename your slot invocations.

## magic.data.common

Minor simplifications

## magic.lambda.mail

Minor simplifications

## magic.lambda.math

Fixed severe error with increment/decrement slots

## magic.lambda.io

Fixed severe error with folder resolving when finding root URL

## magic.lambda.json

Fixed severe error when returning DateTime objects.


# Version 8.1.21

## magic.lambda

Fixed bug in **[or]** and **[and]** slots, preventing short circuiting
when condition cannot possibly evaluate to true. In addition also fixed a
bug in these slots that would sometimes attempt to raise a slot where its
name was "" (empty string).

## Magic (the core)

### Scaffolder results

Hopefully fixed a bug in the rendering of the menu button on Galaxy s series,
which would hide the menu button, making the site impossible to navigate.

Also allowed for anonymous access to the navigation, showing all CRUD
forms, where anonymous users have access to read - Allowing for anonymous
access to backend CRUD endpoints, but only where the backend endpoint
is created such that it allows anonymous access.

Created a modal login form now instead of the hardcoded login
form in the appp.component.html file, which I feel is a much
better approach than the previous existing solution.

# Version 8.1.22

## Magic (the core)

### Fixed severe scaffolding error related to Windows Explorer

When you previously scaffolded a frontend, and you tried to
unzip it using Windows Explorer, this would fail. This did never
happen if you used 7Zip or WinZip, or for that matter any non-Windows
based operating systems, because they're more resistance in regards
to path errors. This would occur due to a double slash `//` in the
paths of the zip file created as a download, containing the Angular
frontend parts.

The symptom was that when the zip file was unzipped, it would
show _"funny folder names"_ inside of it. This if now fixed,
and unzipping using the built in Windows Explorer unzipper,
should work perfectly now.

### Better authentication declarations for frontend

The scaffolded frontend will now allow for CRUD tables not
requiring authentication to be edited and viewed by anonymous users,
without having to login.

### Fixed bug in scaffolded frontend (auth) menu item

It was impossible to create a new role using the scaffolded
frontend, due to not passing in a description when invoking the
backend. This is now fixed.

## magic.lambda.mime

Removed decryption references, since this is not stable enough, and of high
enough quality, due to an _"API architectural flaw"_ in MimeKit, preventing
us from using our own custom storage for private PGP keys, and instead being
forced to rely upon Gnu Privacy Guard, which of course is ridiculous for
web projects. Once MimeKit have better support for providing custom (non-GPG)
types of storage callbacks for looking up private PGP keys during decryption,
we will revisit decryption, and hopefully be able to implement it again.

The project still support PGP signing, _encrypting_, verifying signatures, etc.
Just not decryption of received MIME messages unfortunately.

# Version 8.2.2

**NOTICE - 2 BREAKING CHANGES**

**TL;TR** - Do not update an existing website, unless you can re-crudify all
endpoints, and/or you are _certain_ about what you're doing. If you can re-crudify
all endpoints (backend parts), you should be OK to upgrade though.

## magic.signals

Implemented support for having async slot invocations be _"prioritized"_, if a slot class
implements the `ISlotAsync` interface, and its async implementation can be used. This
implies that there is no longer any needs for explicitly invoking any **[wait.xxx]**
overrides, to have the signaler choose the async slot, since if you're already within in async
context, the async slot will be automatically preferred, and invoked automatically, instead of its
synchronous version. This should *significantly* simplify your Hyperlambda
code, since there are never any reasons to explicitly choose the _"wait."_
slot invocation. In addition, it also allows you to use the same
Hyperlambda from both a synchronous and an async context, resulting in
less _"async compatibility problems"_.

The signaler implementation is also now significantly optimized, in such
that it doesn't create a new synchronization context as many times as it
would previously end up doing. Resulting in among other things, much
better exceptions stacktraces, and fewer synchronization contexts
being created - Resulting in more optimally performing code.

**BREAKING CHANGES**

Notice, this implies that if you want to upgrade an existing application to
use the new core, you'll have to do a find and replace operation through
all your Hyperlambda files/snippets, and replace every occurrency of _"wait."_
with "" (empty string) - Since the async slots no longer exists, and hence
invoking these will throw an exception.

## magic.lambda.io

Fixed a bug when trying to copy a file, and you pass in the destination
as only a folder name. This would occur _only_ in the async version of
the slot.

## magic.lambda

Fixed bug in **[add]** when descendants iterator is used to traverse your
destination nodes. Previously it could trigger an exception, due to enumerator
being changed.

## magic.endpoint

Completely new way to retrieve meta data, much more fault tolerant, and
less dependent upon structure of Hyperlambda file.

## Magic (main)

Remove the _"trash"_ folder entirely, and no longer creating backup
of files replaced during the setup process. This was anyways not necessary,
since if you needed these files, you could anyways find them online.
It only resulted in unnecessary complications.

Optimized how the Crudifier works, by entirely removing the dependencies
upon the dynamic CRUD slots, which you could previously find in the
mssql and mysql folders inside of the _"/files/modules/system/magic.startup/"_
folder. This significantly simplifies your code, and also makes it more
robust, easily maintained, and more easily changed and understood.

**The above is a BREAKING CHANGE** - If you have existing websites,
you should _really_ know what you're doing if you want to update it
to use the new core. If you still want to take the chance of upgrading,
you'll have to use the _"semantic SQL"_ slots directly now instead of the
dynamic CRUD slots.

**Notice** - I was never really happy with the way this used to work
to be honest, since these parts were too complex. However,
now hopefully there won't be any more breaking changes, since I'm fairly
happy with how the entirety of the core works - Including the crudification
process.

Improved the paging in the _"Logs"_ menu item, such that it no displays
the number of _relevant_ records - Implying that it now takes your filter
into account, as it displays the number of log items in your database.

Improved the scaffolded Angular frontend, by checking if JWT token has
expired before I set the user's roles, and if expired, the token is
deleted from local storage.

The scaffolded Angular frontend will now _patch_ records during
updates, completely eliminating the needs for optimistic/pessimistic
database record locking, allowing multiple users to edit the same
record at the same time, without overwriting the other user's changes.

Removed the **[load-app-settings]** and the **[save-app-settings]**
slots in Release builds, due to that having these slots in production
might in theory create security issues, although no endpoints are
invoking them before checking if the user is root or not. Still, this
is defensive coding, and arguably the right thing to do. In a production
environment, you should anyways apply _"appsettings.json"_ settings through
some kind of secret tansformations, etc - And _not_ follow the setup
process, which is the only process that actually uses these slots today
anyways.

Fixed the counting of lines of code created during crudification, which
was previously wrong, and way too small. The crudify process will now
accurately report the number of lines of code created as it crudifies
your database.

Cleaned up a lot of the Hyperlambda in the backend, such as the Hyperlambda
responsible for creating CRUD endpoints, etc.

# Version 8.2.3

## Magic (main)

Re-engineered the authorization parts in the generated frontend, such that
it's now 100% dynamically. Did this by creating a new _"authorization"_ endpoint,
in the backend, that once invoked will return every endpoint, its verb, and
a list of roles allowed to invoke it - Which again is used to dynamically
determine if user has access to invoke endpoint or not.

## magic.endpoint

Fixed a bug in meta data retrieval, where it would not trim names of roles
that are allowed to access an HTTP endpoint.
