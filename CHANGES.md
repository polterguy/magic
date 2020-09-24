
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
