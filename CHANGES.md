
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

Cleaned up the frontend generator's result, such that it's much more fault
tolerant. Among other things, it'll now generate components for entities
that doesn't have a PUT/update endpoint, still allowing for all other
CRUD operations. Also significantly cleaned up the authorization logic,
implementing component to component cross communication, using subscribers,
such allowing for authenticating, and having the view update completely,
without having to reload the page, etc. This of course lends itself to
having the end result subscribing to custom events.

## magic.endpoint

Fixed a bug in meta data retrieval, where it would not trim names of roles
that are allowed to access an HTTP endpoint.

# Version 8.3.1

## Magic (main)

Significantly improved the way the frontend generator creates its HTTP
service methods for CRUD endpoints, by making the code much better, by
grouping methods acting upon the same table into a single property,
returning all methods available for the specific database entity.
Also changed the service method names to reflect their CRUD operation.

Also significantly cleaned up the actual scaffolder process, to allow
for multiple templates, yet still sharing common functionality.

Cleaned up other generated Angular services, to make them more fluid
in feel, and added some slightly better typing - Yet still more work
to be done here.

Added new template which produces a pure Angular HTTP service project
for you, without any GUI or graphical objects - But still creates
Angular HTTP service methods for every CRUD endpoint in your system.

## magic.lambda.io

Passing in the filename to **[io.file.execute]** to make it easier for
files to execute files in relative folders. This will be passed in as
an **[.filename]** argument. Also completely removed the
**[io.files.eval]** slot, since it only creates confusion, since it does
the exact same thing as its execute counterpart.

Created convenience slot called **[io.path.get-folder]** that will return
the folder name given some path.

# Version 8.3.2

## Magic (main)

Added Dark Theme, which uses inverted colors, in addition to some other changes,
such as having the default paging size being 25, and changing some of the buttons
and the margins.

# Version 8.3.3

## magic.lambda.sheduler

Simplified scheduler a bit, avoiding unnecessary arguments in constructor.

# Version 8.3.4

## magic.http

Much more resilient, particularly in regards to DNS changes, due to relying upon `IHttpClientFactory`
now instead of a static `HttpClient`.

# Version 8.4.0

## magic.data.common

Clarified exception thrown as an unsupported **[join]** was supplied during **[sql.read]** invocations.

## magic.lambda.image

New library, intended for doing basic image manipulation. Currently it only has one slot, allowing you to
generate QR codes - But in the future it might be expanded upon, to allow for resizing images, cropping images,
and doing other types of basic image manipulation.

## Magic (main)

Changed AutoComplete keyboard shortcut to be CTRL+SPACE, since ALT+SPACE doesn't seem to work on Windows.
Upgraded Angular components, such as material, CLI, etc to their latest versions.

Minor improvements in UI of Dashboard. Removed the way too verbose explanation/information.

Better example of custom SQL endpoints, end removed complex _"is statistics"_ parts, to refactor
and create better version later. Also significantly improved UX in endpoints, and most other components.

New endpoint to generate QR code, using the new _"magic.lambda.image"_ library, that allows you to
generate QR code, given any type of string/URL/etc, and have these returned back to the client as PNG
files.

# Version 8.4.1

## Magic (main)

Fixed a TypeScript null reference error that would occur if you showed _"System endpoints"_ in the files menu,
and applied filtering to look for a specific endpoint.

Support for displaying image results in hte _"Endpoints"_ menu item, but only for GET invocations. If the
endpoint returns Content-Type of _"image/xxx"_, the results of the invocation will be displayed using an img
tag, and not attempted to be loaded (erronously) into the JSON CodeMirror instance.

In the _"Endpoints"_ file menu, we now also display the _"Content-Type"_ the endpoint returns. In addition,
you can now do basic sorting of endpoints, in addition to the already existing filtering logic. Also,
_"magic"_ endpoints (scaffolded database named magic) will no longer show, unless you explicitly choose
to display system endpoints. Also slightly improved rendering of QUERY argument list, to make them more
explicitly appear like buttons, with hovering and active effects.

Created better alignment of _"view details"_ sheet in scaffolded components, by making sure its colspan
by default is the same size as the number of records returned from _"read"_ endpoint. This makes the colspan
too large, since it'll also include primary keys - Which doesn't doo anything, since browser ignores columns
that are larger than the total number of columns in table. But, it also makes it simpler to add *more* columns
to the material table, since user's don't have to fiddle with the colspan property, unless they add more columns
in the backing database table, and backend HTTP REST endpoint.

Created better example SQL scripts, creating some default databases, solving arguably more _"real world"_
problems, such as translations, registrations, etc.

## magic.lambda.validators

Making sure we show the last iterator's value, which would normally be the argument name, if we throw exceptions.
This would normally result in giving more detailed feedback to the client providing the invalid input.

Also supporting having one validator validating multiple arguments, by invoking `Evaluate` on expression, if
value of validation node is an expression, and invoking validation logic once for *all* values resulting from
iterating expression's results. This allows one single validator to validate multiple arguments.

## magic.endpoint

The meta data retrieval now returns the Content-Type the endpoint returns, if it can deduct it. Notice, this
is not always possible, since the Content-Type might be the results of branching, and different according to
which branch the code takes. But if there's only *one* declaration of Content-Type headers in the endpoint,
the list-endpoints slots will return this during meta data retrieval. And if there is *no* explicit Content-Type
declaration, we know the default will be returned, which is _"application/json"_.

## magic.lambda.strings

Added new slot called **[strings.url-encode]** that allows you to URL encode a string, for passing
it in as a QUERY parameter to for instance an HTTP GET endpoint, etc.

# Version 8.4.2

## Magic (main)

Support for PATCH endpoints in _"Endpoints"_ menu item, including support for transmitting both
plain text and Hyperlambda, using respectively a markdown or a Hyperlambda CodeMirror editor for
supplying the **[body]** argument.

## magic.endpoint

PATCH HTTP verb support, allowing clients to supply non-JSON types of payloads, such as for instance
Hyperlambda or plain text, etc. If you invoke a PATCH endpoint, the payload you supply, will be
passed into your Hyperlambda endpoint file as a **[body]** argument by default, assuming you
send your content as `text/plain` Content-Type.

Supporting **[.accept]** meta information on Hyperlambda endpoint files, declaring which Content-Type
the endpoint can handle - Which is important if you create a PATCH endpoint type, since these types
of endpoints can tolerate *any* types of payloads, including plain text, Hyperlambda, and "whatever"
really. If no explicit **[.patch]** exists on endpoint file, the default of `application/json` is
assumed, and returned back to client.

## magic.lambda

Support for **[whitelist]** slot, creating a context of _"whitelisted slots"_, which are the *only*
legal slots to invoke withing its given lambda object. Refer to magic.lambda's documentation for
details. Also changed **[vocabulary]** now such that it only returns slots legally invoked by
caller, within the context, which changes of course as you create a new **[whitelist]** scope.

## magic.lambda.slots

Supporting **[whitelist]** signal invocations, similar to magic.lambda, with roughly the same effect,
except of course being *dynamic* slots instead of statically C# created slots.

# Version 8.4.3

## magic.lambda

Fixed a security flaw in **[whitelist]** which could result in having code passed into a whitelist
execution manipulate the parent function object's code as it was being executed, including changing
the whitelist's **[vocabulary]**, if the **[set-name]** or the **[set-value]** slots were whitelisted.

**Breaking change** - To implement this correctly, I had to change the logic of whitelist evaluations,
such that they're now considered _"first class function invocations"_, not having access to *anything*
outside of the scope of their own execution context.

Hence, the **[whitelist]** keyword now functions similar to e.g. a **[slots.signal]** invocation,
in such that the only way for a whitelisted execution context to return data back to the parent scope,
is by using for instance the **[return]** slot, etc.

## magic.endpoint

Stabilised the PATCH endpoint slightly, now only accepting the following `Content-Types`

1. application/x-www-form-urlencoded - Allowing you to pass in multiple arguments as URL encoded
2. application/hyperlambda - Allowing you to pass in Hyperlambda as your main payload
3. application/x-hyperlambda - Override of the above, for cases where proxies might strip the above, due to not being a registered MIME type, and not officially sanctioned
4. text/plain - Anything *but* the above 3 types

Depending upon your Content-Type type, Magic will now intelligently parse your payload, and transmit it correctly
into your Hyperlambda file. Notice, if you use anything *but* _"application/x-www-form-urlencoded"_ as your
Content-Type, a **[body]** argument, containing the entire payload will be added to the **[.arguments]** collection
as your Hyperlambda file is evaluated. Hence, you can retrieve the payload by reading it from the **[body]**
node's value, inside of your **[.arguments]** collection, constructed as you execute your endpoint.

If you use _"application/x-www-form-urlencoded"_ as your Content-Type, the parameters passed in can be referenced
through your **[.arguments]** collection, using their parameter names. Notice, if you explicitly declare an **[.arguments]**
collection for your endpoint, Magic will still verify that no illegal arguments are passed into it. This implies that
if you for instance want to create an _"application/hyperlambda"_ type of endpoint, and you want it to have an
explicit **[.arguments]** collection - You'll have to explicitly declare that your Hyperlambda file can handle
the **[body]** argument, which will contain the plain text version of your Hyperlambda, injected into the arguments
collection by the endpoint resolver.

Magic will not discriminate between arguments passed in as URL encoded or body payloads, allowing the consumer
of your endpoint to choose which Content-Type to transmit his payload with, depending upon what's considered
convenient for his particular use case. The **[.accept]** node is only a convenience META data information
piece of text, and not used for validating the input in any ways - Since this would arguably be redundant due to
that Magic itself validates it during the endpoint resolving process. This makes it simpler to interact with
browsers, and other types of clients, where the client has less control over the Content-Type the payload is
transmitted with.

# Version 8.4.4

## magic.lambda.crypto

Created full support for RSA cryptography, having added the following slots.

* __[crypto.rsa.create-key]__ - Creates an RSA keypair
* __[crypto.rsa.sign]__ - Cryptographically signs a message
* __[crypto.rsa.verify]__ - Verifies a previously created cryptographic signature
* __[crypto.rsa.encrypt]__ - Encrypts a piece of text/data using some public key
* __[crypto.rsa.decrypt]__ - Decrypts a previously encrypted message using a private key

Refer to the documentation of magic.lambda.crypto for details.

# Version 8.4.5

## magic.lambda.crypto

Further expanded upon the library, creating more and better support for binary byte[] input/output,
such as returning encrypted messages as `byte[]`, handling (correctly) `byte[]` input to both
decrypt, verify signatures, etc.

Changed the **[crypto.random]** slot, such that it now only returns alphanumeric characters, and no special characters.

Added the two following slots.

* __[crypto.aes.encrypt]__ - Encrypts data using AES encryption
* __[crypto.aes.decrypt]__ - Decrypts data previously encrypted with AES encryption

Refer to the documentation of magic.lambda.crypto for details.

# Version 8.5.0

## Magic (main)

Created support for creating a server RSA key, in addition to support for managing public
cryptography keys belonging to others. This creates secure communication back and forth between
your server and other servers - Which again allows you to associate a bunch of slots with a public
RSA key, for then to allow the owner of the key coupled with it to cryptographically
transmit a message to your server, and execute Hyperlambda on your server, according to
what vocabulary he is legally allowed to execute.

**Breaking change** - Notice, the above feature requires one *additional* table in your magic
database called _"crypto_keys"_. If you don't want to drop your existing _"magic"_ database
and re-create it, you can execute the following SQL for your database to migrate your database
to support the new tables.

**MySQL**

```
create table crypto_keys (
  id int(11) not null auto_increment,
  subject varchar(120) not null, /* Typically the name of the owner of the key */
  domain varchar(250) null, /* The base URL of the subject */
  email varchar(120) null, /* Email address of owner */
  content text not null, /* Actual public key */
  vocabulary text not null, /* The vocabulary the key is allowed to evaluate */
  fingerprint varchar(120) not null, /* Public key's SHA256 value, in 'fingerprint' format */
  imported datetime not null default current_timestamp,
  type varchar(20) not null, /* Typically 'RSA' or something */
  primary key (id),
  unique key id_UNIQUE (id),
  unique key fingerprint_UNIQUE (fingerprint),
  unique key email_UNIQUE (email),
  unique key url_UNIQUE (domain)
);
```

**SQL Server**

```
create table crypto_keys (
  id int not null identity(1,1),
  subject nvarchar(120) not null,
  domain nvarchar(250) not null,
  email nvarchar(120) not null,
  content text not null,
  vocabulary text not null,
  fingerprint nvarchar(120) not null,
  imported datetime not null default getutcdate(),
  type nvarchar(20) not null,
  constraint pk_crypto_keys primary key clustered(id asc),
  unique(fingerprint),
  unique(email),
  unique(domain)
);
```

If you don't care about your existing magic database, you can also just drop the database entirely,
before you start your backend - At which point you'll be asked to setup the database again, which
will create the correct database schema, including the above table.

The above SQL scripts will add the new table to your database. Make sure you are using your _"magic"_
database when you invoke it, which you can do with the following SQL.

```
use magic;
```

## magic.lambda.crypto

Added support for returning result of **[crypto.hash]** either as raw bytes (useful for AES crypto),
or as fingerprint value (useful for displaying to human beings).

Created the following new slots.

* __[crypto.encrypt]__ - Cryptographically signs and encrypts some content
* __[crypto.decrypt]__ - Decrypts and verifies the signature of some content encrypted with the above slot
* __[crypto.get-key]__ - Returns the encryption key some content was encrypted with using the above slot

The above slots are convenience slots that allows you to combine RSA and AES encryption, to encrypt
some message for transmitting over an insecure channel to some recipient. Refer to the documentation
for _"magic.lambda.crypto"_ for details about how to use these slots.

## magic.lambda.validators

Made the exception thrown during email validation slightly more _"semantically correct"_, by making
sure we display the argument that did not validate as an email address when exception is thrown.

Fixed an error in **[validators.mandatory]** that would circumvent its entire logic.

## magic.node.extensions

Support for `byte[]` types in Hyperlambda, using the _"bytes"_ typename. Raw bytes persisted into
Hyperlambda will be persisted as base64 encoded, and then automatically converted back to `byte[]`
again once the Hyperlambda is parsed.

## magic.lambda.http

New slot called **[http.patch]**, that creates an HTTP REST request with the `PATCH` verb.

# Version 8.5.1

## Magic (main)

Support for creating new RSA key pairs, which will backup the old key pair, and still allow
clients to use the old key pair, but by default try to use the newly generated key pair
during decryption of cryptographic lambda invocations.

Fixed a bug that made the _"Logs"_ menu item return nothing if the user for some reasons
had filtered such that there would be only one result, or there only was one result in
the logs.

Also made some minor improvements to the UX of the _"Crypto"_ menu item, allowing for
changing a public key, among other things ...

## magic.lambda.crypto

Simplified and improved the cryptography slots, in preparation of creating a pure C#
project, allowing easy usage of Bouncy Castle in C# projects.

# Version 8.6.0

## Magic (main)

Re-engineered the **[magic.crypto.http.eval]** slot such that it no longer encrypts the
payload, but only cryptographically signs it. This is a significant optimisation, in
addition to that the TLS parts of HTTP should any ways do a good enough job at encrypting
the actual message. Also changed the way the _"eval"_ endpoint works, to
pair it with the functionality of the slot invoking it.

Fixed an error in the _"babelfish.sql"_ script, that would make it choke as you
executed it in the _"Sql"_ menu item.

Created a couple of synamic convenience slots, such as **[magic.crypto.get-server-public-key]**
to return the server's public RSA key - In addition to **[magic.crypto.get-public-key]** to
retrieve some public RSA key from a fingerprint. The latter will lookup the fingerprint
from the _"crypto\_keys"_ database table, and return both the public key, and the
vocabulary the key is allowed to evaluate.

## magic.signals

Fixed a severe error that would sometimes result in unpredictable results, due to
removing the wrong stack item when recursively invoking dynamic slots, and other
types of methods, that created stack items.

Notice, this made the generating process of the frontend previously fail, due to
recursively invoking slots, which started occurring in the release we implemented
the **[whitelist]** keyword - Sorry ... :/

If you had dynamic slots invoking dynamic slots, and it was behaving unpredictable,
then this release should fix your issues.

## magic.lambda.crypto

Separated the logic of cryptographically signing a message, and encrypting it,
such that it's now possible to only sign a message. Simplified and refactored
the way this entire project works now.

## magic.crypto

New utility project, containing only cryptographic helper classes and methods.

## magic.lambda.http

Improved logic of **[http.patch]** slot. Some work remains here, but at least it's
better than previously.

## magic.node.extensions

Implemented support for converting between `byte[]` and `string` types.

## magic.lambda

Implemented support for converting between `byte[]` and `string` types
in the **[convert]** slot.

## magic.endpoint

Slightly improved the way we handle `ActionResult` when returning response
to client. Some more work remains here, but at least now it's better.
NEeds cleanup.

## magic.http

Also did some cleaning here. More work to be done, but it should hopefully
behave *better* now ... :/

# Version 8.6.1

## Magic (Main)

Improvements in how it handles crypto invocations, and vocabulary associated
with a public key. Among other things, evicts from cache when public key is
saved now.

Changed the way the dynamica **[magic.crypto.get-server-public-key]** works.
It'll now return both the fingerprint and the public key itself back to caller.

Fixed several minor errors in regards to resolving of public keys, and generating
server keys. For instance no longer giving the user the option of generating a
key with a strength of 1024, since it's simply not large enough to encrypt the
symmetric AES key used to encrypt and sign packages, etc.

Better positioning of CodeMirror hints popup.

## magic.http

Minor cleanups and optimisations in the way it handles the response from
HTTP invocations. Still needs further cleanups.

## magic.endpoint

Minor improvements in how it handles the response object it returns.
Still needs further cleanups.

## magic.lambda.http

Minor improvements in how it handles the response object it returns.
Still needs further cleanups.

# Version 8.6.2

## Magic (main)

Rewritten (yet another time!) the logic of cryptographically signed
HTTP invocations, after getting advice from the Redditers at /r/cryptography.

## magic.lambda

Fixed a severe error in **[return]** and **[return-nodes]** that would
sometimes return nothing, even though it should, due to that the results
of expressions evaluated was not cloned while returning nodes.

## magic.lambda.caching

Made sure we clone the node we return if we're supposed to return an
entire node, to avoid having caller modify the cache unintentionally.

## magic.library

Made sure we return the correct HTTP status code when a public Hyperlambda
exception is thrown.

# Version 8.6.4

## magic.lambda.crypto

Fixed minor error that would try to verify the signature of an encrypted
package in **[crypto.decrypt]** even if you didn't supply a **[verify-key]**
argument, which would make the invocation fail.

# Version 8.6.5

## magic.lambda

Added support for converting from `byte[]` to base64 using the **[convert]** slot,
passing in base64 as the **[type]** argument.

# Version 8.6.6

## Magic (main)

Support for applying license during setup of Magic. Also showing license information
on main landing page of Magic now by default.

## magic.signals

Support for richer license keys, containing meta data, and also being asymmetrically and
cryptographically signed by Server Garden's private RSA key.

# Version 8.6.7

## Magic (main)

Significantly stablised Magic on Windows machines, by creating a QA document, I have
been following to the last detail, exposing several severe errors, particularly with
Visual Studio, SQL Server and Windows based development. If you previously had issues
with testing Magic with SQL Server, Visual Studio, or on Windows - This release
probably fixes your problems.

Removed the ability to configure which database to use for authentication and logging,
since I suspect it's never used with anything but the default version anyways, and it
only complicated the code and made it more difficult to understand.

Created the ability to configure a public crypto key as _"enabled"_ or not, implying
if it's not enabled, no invocations cyrptographically signed with that key will be
accepted by the server.

Fixed some minor errors in administrating your users that wouldn't propagate errors
to the user, making errors invisible for the end user as he tries to administrate
his users.

Fixed *a lot* of cryptography errors related to SQL Server. Basically, the cryptographic
signed invocations didn't work *at all* on SQL Server due to an erronously added _"dbo"_
prefix in their endpoint URLs.

Made it simpler to start Magic backend on Windows with Visual Studio by removing IIS
profile entirely, and only relying upon kestrel.

Fixed initial debugging of backend on Visual Studio such that it now shows (opens) the
ping endpoint by default as you start the backend.

**Breaking change** - Added some changes to the magic database script, specifically
added the ability to have a boolean flag (enabled) for the crypto_keys database table.
Either apply the changes for this specific column, or drop and re-create your magic database
as you install this version. Also created new _"magic_version"_ database table, to keep
track of versioning in the future, and hopefully be able to create some sort of database
migration script(s) logic in future releases - To avoid having to drop and re-create
database every time users installs a new version.

## magic.lambda.logging

Removed the ability to configure which database to persist log entries into, since
it only complicates the code, and I suspect it's never really actually used with anything
but the default value.

## magic.lambda.strings

Removing arguments after invocation to **[strings.concat]**.

## magic.lambda

Removing arguments after invocation to **[add]**, **[insert-before]** and **[insert-after]**.

Added **[context]** slot, allowing Hyperlambda code to dynamically add values onto the stack.
Also added **[get-context]** that retrieves dynamically added objects from the stack.
Notice, a dynamically created stack object will *not* interfer with C# created stack objects,
and Hyperlambda *cannot* retrieves C# created stack objects either. This is to make it impossible
for Hyperlambda code to _"clash"_ with C# created stack objects, and/or manipulate such.

Added support for _"fromBase64"_ type in **[convert]**, which will assume the given value
is a base64 encoded `byte[]`, and convert it back to such, and return to the caller.

# Version 8.6.8

## Magic (main)

Fixed scaffolder output such that it will build in production builds using for instance
`ng build --prod --aot`, which allows for easily deploying results to Azure, and integrating
scaffolded result into pipelines, etc - Without having to apply code changes before it builds.

# Version 8.6.9

## Magic (main)

Showing the user a _"What's next"_ list of items after having followed the setup process, to
help and guide him through generating a server key pair, and crudifying his magic database.

Displaying statistics on ROI Magic generated on home components.

Fixed production builds of the dashboard, such that the Magic frontend now should be possible
to easily deploy to for instance Azure etc, without having to apply code changes.

## magic.node

Allowing for creating string literals with *only* escaped `\n` characters.

# Version 8.7.1

## Magic (main)

Created a filter button for logs that allows the user to click it and filter on only errors.

Changed crudifier such that it doesn't attempt to crudify tables that have no columns, and
also allowing user to set a global checkbox value which if set, by default will allow the client
to transmit column values with default values to PUT and POST endpoints. If the latter is set,
the crudifier will create POST and PUT endpoints for tables that have only automatic columns,
which previously wasn't the case.

Implemented placeholder for `app-selector` component, to allow users to consume it and supply
a placeholder (tooltip) when consuming it. Also this component now adds a limit filter of `-1`,
which returns *all* items from table if consumed by default. Fixed type of model to _"any"_ type,
which probably is a more correct type declaration.

Sorting tables in crudifier, since Microsoft SQL Server doesn't necessarily return columns
sorted alphabetically, which makes it easier to find the table you're looking for when you're
looking through your tables.

Statistic charts on logs menu item, to display some basic statistical charts about log items
created in the system over time.

Documented keyboard shortcuts, and implemented a couple of more shortcuts in the SQL menu item.

Allowing user to export SQL results to JSON and CSV.

Avoid returning more than 250 records by default in SQL execution, to avoind exhausting server
accidentally by selecting from a table with millions of records, or something.

## magic.data.common

Created the ability to group by aggregate columns, at which point no escaping of table names
is done.

Implemented **[max]** argument on **[xxx.select]** slots, to safe guard against SQL commands that
can exhaust the server by retrieving too many records. This feature is used in select slots for
both Microsoft SQL Server and MySQL. Its default value is -1 though, which will *not* safe guard
at all. But if you provide a value here, then this is the maximum number of records that will be
returned to the caller.

Made the `AppendGroupBy` method virtual to allow specialised implementations of `SqlCrudReadBuilder`
to override `AppendTail` and still call base implementation creating group by SQL segments.

## magic.lambda.mssql

Fixed a severe error that made it impossible to add **[group]** arguments to **[mssql.read]**
invocations.

# Version 8.7.2

## Magic (main)

Keeping history of backends' the user has previously connected to in localStorage in the
login form, allowing him to select the URL by clicking it.

Better styling of results in SQL menu item, to avoid overflowing columns when selecting
very large data.

Created the ability to turn off safe mode in the SQL menu item.

Allowing user to export SQL result to insert SQL statements, in addition to CSV and JSON
result.

# Version 8.7.3

## Magic (main)

Significantly simplified the setup process code/logic. Among other things, we've completely
removed the file copying/overwriting operations, allowing the end user to much more easily
update his current installation, without having to keep files from one version to another, etc.
The *only* file that's now actually written to during setup is the _"appsettings.json"_ file.

Renamed the auth dynamic slots, to correctly namespace them, into **[magic.auth.xxx]** namespace.

Simplified crudification process by taking advantage of the new **[data.xxx]** slots.

Implemented support for multiple connection strings in the SQL menu item.

## magic.data.common

Created **[xxx.yyy]** slots for transparently using the default database adapter, as
configured in your appsettings.json file, to avoid having to dynamically create slot
invocation names when evaluating some database specific slot. All of these have the
form of **[data.xxx]**, where _"xxx"_ is the specialised implementation, such as _"mssql"_
or _"mysql"_, etc.

Also updated the documentation for this project extensively, and move parts of it from
the MySQL and MS SQL documentation into this project, since we now have the common
**[data.xxx]** slots, providing _"generic"_ documentation, that applies to all
specialised data adapters.

Allowing to supply `*` as Authorization during crudification, simply meaning _"authenticated"_,
and not requiring a specific role.

Moved all startup files into sub-module folders, to group related code snippets together
where they logically belong.

Caching the result of sql/database.get.hl endpoint. This will *significantly* increase
load time on the SQL menu item, on consecutive times. Since the result of this endpoint
only changes when a new table, database, etc have been created, or your database schema
somehow changes, caching this endpoint's result should not be a problem. However, we only
cache the result for 5 minutes. Its cache key is `sql-databases` in case you want to
explicitly flush it.

Allowing for providing multiple connection strings to connect to different servers, by
separating the connection string and the database by pipe character (|). Example can
be found below.

```
data.connect:[server|database]
```

The above will use the _"server"_ connection string, expected to be found under your
database configuration like `databases:mysql:server`, and the database catalogue
of `database`.

## magic.lambda.logging

Taking advantage of the **[data.xxx]** slots, to simplify code to insert and read
log entries.

## magic.lambda.scheduler

Taking advantage of the **[data.xxx]** slots, to simplify code to insert and read
tasks and due dates.

## magic.lambda.config

Created **[config.section]** that returns an entire section from your _"appsettings.json"_
file, as a key/value pair.

## magic.library

Support for sub-module startup folders, allowing to group relevant code snippets,
where they belong, according to which sub-module they belong to.
