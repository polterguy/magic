---
title: magic.lambda.crypto
---

The magic.lambda.crypto project provides cryptography helper slots for Magic, allowing you to use both symmetric
and asymmetric cryptography operations in your Hyperlambda applications. The symmetric parts of the project is
using AES internally, and the asymmetric parts is using RSA. In addition to a bunch of _"low level slots"_, the
project also contains combination slots, combining RSA and AES, allowing you to both encrypt and sign a message,
using a single signal invocation. This project also allows you to create RSA key pairs, in addition to
cryptographically hashing files and payloads, etc. More specifically this project contains the following slots.

* __[crypto.rsa.create-key]__ - Creates a new RSA keypair
* __[crypto.rsa.encrypt]__ - RSA encrypts a message
* __[crypto.rsa.decrypt]__ - RSA decrypts a message
* __[crypto.rsa.sign]__ - Cryptographically signs a message
* __[crypto.rsa.verify]__ - Verifies a cryptographic signature of some message
* __[crypto.aes.encrypt]__ - AES encrypts a message
* __[crypto.aes.decrypt]__ - AES decrypts a message
* __[crypto.fingerprint]__ - Creates a fingerprint of something
* __[crypto.get-key]__ - Returns the fingerprint of the public key associated with message
* __[crypto.random]__ - CSRNG creating random seeds for you
* __[crypto.random.int]__ - CSRNG creating random integer value for you
* __[crypto.hash]__ - Hash some message or payload using the specified **[algo]** or **[algorithm]**
* __[crypto.hash.md5]__ - MD5 hash some message or payload
* __[crypto.hash.sha1]__ - SHA1 hash some message or payload
* __[crypto.hash.sha256]__ - SHA256 hash some message or payload
* __[crypto.hash.sha384]__ - SHA384 hash some message or payload
* __[crypto.hash.sha512]__ - SHA512 hash some message or payload
* __[crypto.password.hash]__ - Creates a Blowfish uniquely salted hash
* __[crypto.password.verify]__ - Verifies a Blowfish uniquely salted hash
* __[crypto.encrypt]__ - High level slot combining RSA and AES to encrypt some message
* __[crypto.decrypt]__ - High level slot combining RSA and AES to decrypt some message
* __[crypto.sign]__ - High level slot to sign some message
* __[crypto.verify]__ - High level slot to verify a signature of some message
* __[crypto.seed]__ - Allows you to explicitly seed the CSRNG instance using for instance a manually provided seed

## How to use [crypto.random]

This slot create a bunch of random characters, or bytes for you.
The slot can optionally take a **[min]** and **[max]** argument, which defines the min/max length of the
random bytes/characters returned. If not supplied, the default values for these arguments are respectively 10 and 20.
This slot is useful for creating random secrets, and similar types of random strings, where you need cryptographically
secured random strings or byte arrays. An example of generating a cryptographically secure random string of text
between 50 and 100 characters in length can be found below.

```
crypto.random
   min:50
   max:100
```

Notice, the **[crypto.random]** slot will _only_ return characters from a-z, A-Z and 0-9. Which makes
it easily traversed using any string library. However, you can provide a **[raw]** argument, and set its
value to boolean true, at which point the slot will return the raw bytes as a `byte[]`. This has a much
larger amount of entropy than simply using alphanumeric characters for the same size - Which is
important as you start creating keys for AES cryptography operations etc.

## How to use [crypto.random.int]

This slot create a random integer value for you using a CSRNG generator.
The slot can optionally take a **[max]** argument, which defines the maximum value it will return.
This slot is useful for creating random integers where you need cryptographically
secured random values. An example of generating a cryptographically secure random string integer
with a maximum value of 1024 can be found below.

```
crypto.random.int
   max:1024
```

## How to use [crypto.hash] and [crypto.hash.xxx]

The **[crypto.hash]** slot can be used to generate hash values. When you invoke it, you can choose
between having the hash returned as raw a `byte[]`, as a _"fingerprint"_ or as its bit encoded hex
version. Below is an example of all three of these formats.

```
.data:Some data to hash

crypto.hash:x:@.data
   format:fingerprint

crypto.hash:x:@.data
   format:text

crypto.hash:x:@.data
   format:raw
```

To override the hashing algorithm used when creating hash values, apply an **[algorithm]** argument, and
set its value to the hashing algorithm you want to use. You can choose between the following hashing
algorithms as you consume the above slot.

* sha1
* md5
* sha256
* sha384
* sha512

**Notice** - sha1 and md5 is supported _only_ for legacy reasons, and _should not be used_ unless you have
a legacy system depending upon it. Sha1 and md5 are considered weak today due to the statistical probability
of that they can result in what's commonly referred to as _"hash collision"_.
This project also contains convenience overloads with the hashing algorithm being a part of the name of the
invocation, such as illustrated below.

* __[crypto.hash.sha1]__
* __[crypto.hash.md5]__
* __[crypto.hash.sha256]__
* __[crypto.hash.sha384]__
* __[crypto.hash.sha512]__

In addition you can hash a file directly, without having to load it first, by providing a **[filename]** argument
to it, such as illustrated below.

```
crypto.hash.sha256
   filename:/README.md
```

### About cryptography fingerprints

The fingerprint format resulting from a hash invocation is useful due to being much more easily read by
humans, and in such a regard better suited for being stored as a key reference into for instance a database,
and/or transmitted as a key reference over the network to other machines.

A fingerprint is actually just a cryptographic hash of your data, such as for instance your public key,
payload, etc.

## How to use [crypto.seed]

No cryptography operation is more secure than the CSRNG instance used to generate random numbers and characters.
This project accommodates for that, by explicitly allowing you to add to its CSRNG seed with something resembling
the following.

```
crypto.seed:Foo Bar Whatever Some Random Seed
```

Internally this is used in Magic by invoking the above slot with the value of its auth secret during
startup and setup. Since this value can be manually edited by the end user, this provides you with
a _"super paranoid"_ solution to ensure extremely large amounts of entropy in its internal CSRNG
instance. If you wish to further seed the CSRNG, you can invoke at any point in time, with some random
humanly provided gibberish, further adding to its entropy, which later will be used when ever
some cryptographically secured random strings or bytes are required, such as when generating key pairs,
using combination cryptography, etc. Such seed invocations are _"cummulative"_ and _adds_ to the existing
entropy, implying for each invocation to **[crypto.seed]**, the CSRNG engine of Magic becomes more
unpredictable.

## Hyperlambda and cryptography

The magic.lambda.crypto project supports several cryptographic functions, but first a bit of cryptography theory.
Public key cryptography, or what's often referred to as _"asymmetric cryptography"_ is based upon
a *key pair*. One of your keys are intended for being publicly shared, and is often referred to
as _"your public key"_. This key can do two important things.

1. Your public key can encrypt data such that *only* its private counterpart key can decrypt the data
2. Your public key can verify that a message originated from a party that has access to its private counterpart

Hence, keeping your *private* key as **private**, is of outmost importance, otherwise 3rd
parties might read messages others send to you, and also impersonate you in front of others. In addition, securely
delivering your public key to the other party, is of equal importance, to make sure they're using the *correct*
public key in their communication with you. If you can keep your private key private,
and securely deliver your public key to others, you have a 100% secure channel to use for communication,
preventing malicious individuals from both reading what others send to you, and also tampering with the
content you send to others, before the other party receives it. Hence, cryptography is about two main subjects.

1. Encrypting messages sent *to you*
2. Allowing you to provide guarantees that a message originated *from you*

Depending upon your paranoia level, you might just send your public key in an email, which is considered insecure -
Or you might need to physically meet the person whom you want to communicate with,
and give him a USB stick with your public key, which is considered full paranoia level. The latter might be important
if you fear what's often referred to as a _"man in the middle attack"_, where some malicious adversary, takes your public key,
and gives a bogus and fake public key to the other party. This results in that the man in the middle
can intercept your communication, decrypt it, and re-encrypt it with your public key, before he or she
sends it to you - In addition to that he can use a similar mechanism to impersonate your signatures,
allowing the other party to falsely believe some message originated from you, when it did indeed originate
from a malicious _"man in the middle"_.

There are several different ways to create a key pair, just have the above in mind as you start using
cryptography in your Hyperlambda applications. Most of the cryptography functions in this library is
using Bouncy Castle, which is a thoroughly tested library for doing cryptography. Bouncy Castle is
owned by a charitable organisation in Australia, so they don't need to obey by American laws, reducing
American intelligence services ability to coerce them to build backdoors and similar constructs
into their code. Bouncy Castle is also Open Source, allowing others to scrutinise their code for such
backdoors. However, with cryptography, there *are no guarantees*, only a _"general feeling and concent"_
amongst developers that it's secure.

The asymmetric parts of this project is built upon RSA for its public and private key pairs.

### Creating an RSA keypair

To create an RSA keypair that you can use for other cryptographic services later, you can use something as follows.

```
crypto.rsa.create-key
   strength:2048
   seed:some random jibberish text
```

The above will return 4 nodes to you as you invoke it.

* __[private]__ - Base64 encoded private key in DER format
* __[public]__ - Base 64 encoded public key in DER format
* __[fingerprint]__ - Fingerprint encoded SHA256 hash of your _public_ key
* __[fingerprint-raw]__ - Raw SHA256 hash of your public key

Both the **[strength]** and **[seed]** is optional above. Strength will default to 2048, which might be too weak
for serious cryptography, but increasing your strength too much, might result in that the above function spends several
seconds, possibly minutes to return if you set it too high - In addition to that your key pair becomes very large.
The **[seed]** is optional, and even if you don't provide a seed argument, the default seed should still be strong
enough to avoid predictions. Depending upon your paranoia level, you might want to manually seed the above
slot by having users type in random text as they generate keys. A major security concern in cryptography is CSRNG,
or what's referred to as _"Cryptographically Secure Random Number Generators"_, which aren't always as cryptographically
secure as we might think, since if its seed is predictable, the random bytes it generates can easily be _"replayed"_.

A good strength for an RSA key, is considered to be 4096, which developers around the world feels are secure enough
to avoid brute force _"guessing"_ of your private key. According to what we know about cryptography, all other concerns
set aside, a 4096 bit strength key pair, *should* be impossible to break. If you're just playing around with cryptography
to learn, 1024 is probably more than enough.

Notice, if you want the key back as raw bytes, you can supply a **[raw]** argument, and set its value to boolean
true, at which point the returned key(s) will only be DER encoded, and returned as a raw `byte[]`. This might be
useful, if you for instance need to persist the key to disc, as a binary file, etc. All the RSA slots can return
their results as `byte[]` values, if you provide a **[raw]** argument to them, and set its value to true.
If you don't provide a raw argument, the returned value will be base64 encoded DER format.

This slot will also return the fingerprint of your public key, which is useful to keep around somewhere,
since it's used in other cryptographic operations to identify keys used in operation, etc. The public key's
fingerprint is usually used to identify a specific key somehow.

### Cryptographically signing and verifying the signature of a message

You can use a previously created private RSA key to cryptographically sign some data or message, intended to be passed
over an insecure context, allowing the caller to use your public key to verify the message was in fact created
by the owner of the private key. To sign some arbitrary content using your private key, and also verify the message
was correctly signed with a specific key, you can use something as follows.

```
// The message can also by byte arrays.
.message:Some message you wish to sign

crypto.rsa.create-key

// Notice, using PRIVATE key
crypto.rsa.sign:x:@.message
   private-key:x:@crypto.rsa.create-key/*/private

// Uncommenting these lines, will make the verify process throw an exception
// set-value:x:@.message
//    .:Some message you wish to sign - XXXX

// Notice, using PUBLIC key
crypto.rsa.verify:x:@.message
   signature:x:@crypto.rsa.sign
   public-key:x:@crypto.rsa.create-key/*/public
```

If somebody tampers with the content between the signing process and the verify process, an exception will
be thrown during the verify stage. Something you can verify yourself by uncommenting the above **[set-value]**
invocation. Throwing an exception is a conscious choice, due to the potential security breaches an error
in your code might have, creating a false positive if you erroneously invert an **[if]** statement. Even though
this is technically _"using exceptions for control flow"_, it has been a conscious design choice
as the library was created, to avoid false positives during the verification process of a signature.

Notice, if you want the signature back as raw bytes, you can supply a **[raw]** argument, and set its value to boolean
true, at which point the returned signature will be returned as a raw `byte[]`. This might be
useful, if you for instance need to persist the signature to disc, as a binary file, etc.
If you don't provide a raw argument, the returned value will be a base64 encoded byte array.

### Encrypting and decrypting a message using RSA

To encrypt a message, you can use something as follows.

```
.message:Some message you want to encrypt

crypto.rsa.create-key

crypto.rsa.encrypt:x:@.message
   public-key:x:@crypto.rsa.create-key/*/public

crypto.rsa.decrypt:x:@crypto.rsa.encrypt
   private-key:x:@crypto.rsa.create-key/*/private
```

Notice how the encryption above is using the *public key*, and the decryption is using the *private key*. The encrypt slot
will internally base64 encode the encrypted data for simplicity reasons, allowing you to immediately inspect it as text,
since encryption will result in a byte array, which is often inconvenient to handle.
You can override this by passing in a **[raw]** argument, and set its value to true, at which point a `byte[]` will be
returned.
You can also supply **[raw]** as you invoke **[crypto.rsa.decrypt]** if you know the content in the message is
not a string, but rather an array of `byte[]`. Base64 encoding a byte array normally makes it larger in size,
and also require CPU resources in both ends of the communication, implying it is sometimes important to have the
raw byte array, instead of its base64 encoded equivalent.

### Symmetric cryptography using AES

RSA is asymmetric cryptography, implying a different key is used for *decrypting* the data than the key that
was used to *encrypt* the data. Hyperlambda also supports *symmetric* cryptography, more specifically the AES
encryption algorithm. This algorithm requires the *same key* to decrypt some content that was used to encrypt
the data, and the key must either be 128, 192 or 256 bits long. Below is an example.

```
crypto.aes.encrypt:Howdy, this is cool
   password:Howdy World this is a passphrase that guarantees 256 bits strength

crypto.aes.decrypt:x:-
   password:Howdy World this is a passphrase that guarantees 256 bits strength
```

The length of the key argument you provide, becomes the bit strength of the encryption, ranging from
128 through 192 to 256 bits. However, even though the key you normally use for encrypting and decrypting
when using AES is supposed to be a `byte[]`, this project will automatically convert any passphrase
specified from a string to a SHA256 hash value. This allows you to use *any* passphrase you wish,
while avoiding reducing entropy, making it harder to crack the encrypted message.

Even though AES has low bit strength, it's still considered one of the strongest forms of cryptography
that exists, assuming you use it *correctly*. For the record, this library does *not* use the built in
AES library from .Net, which has several security issues, due to the way it handles padding among other
things - Neither does this library simply convert strings to `byte[]` arrays using `Encoding.UTF.GetBytes`,
which *significantly* reduces entropy, and makes your message easily cracked by a malicious agent with
some resources. Instead Magic uses Bouncy Castle, which does not have these security holes, in addition
to that it creates a SHA256 hash of passphrases used, if you provide a string, keeping as much entropy
as possible. However, if you want to decrypt it using *other* libraries, you'll have to inform the other
party of that the passphrase supplied is actually supposed to be hashed using SHA256 before supplied
as the `key` during decryption.

The library also supports using raw `byte[]` values as its **[password]** value, allowing you
to generate a random array of bytes, either 16, 24 or 32 bytes in size, and use this as your
passphrase directly - At which point the byte array will be used as is, and not hashed in any ways
before encryption/decryption occurs.

Due to AES' blistering speed and strength, it is often wise to combine asymmetric cryptography with
symmetric cryptography, which can be used by generating a random symmetric key/passphrase, then encrypt
this passphrase using asymmetric cryptography, such as for instance RSA, for then to use the passphrase
to encrypt the actual main data the caller wants to transmit. This has several advantages, such as
reducing the size of the data sent, while still providing the benefits from asymmetric cryptography,
such as securely sharing the public key, etc. Of course, sharing a symmetric key without major hassle,
and/or making adversaries also get a hold of it, is practically *very difficult* for obvious reasons,
unless you can asymmetrically encrypt the symmetric key.

If you only need a random array of 32 bytes, to use as your passphrase, in combination with for
instance RSA asymmetric cryptography - You can use the **[crypto.random]** slot as follows.

```
crypto.random
   min:32
   max:32
   raw:true

crypto.aes.encrypt:Some very, very, very secret text
   password:x:@crypto.random

crypto.aes.decrypt:x:-
   password:x:@crypto.random
```

## Combining RSA and AES cryptography

AES and RSA are more useful when combined together. Hence, this project contains the following convenience slots, that combines
these two cryptography functions together.

* __[crypto.encrypt]__ - Encrypts some message using AES + RSA, and signs the message in the process
* __[crypto.decrypt]__ - Decrypts some message using AES + RSA, optionally verifying a signature in the process
* __[crypto.sign]__ - Cryptographically signs a message using RSA and creates a package containing both signature, signing key's fingerprint, and the content that was signed
* __[crypto.verify]__ - The opposite of the above, that verifies the integrity of a package created with **[crypto.sign]**
* __[crypto.get-key]__ - Returns the fingerprint of the RSA key that was used to encrypt some message using **[crypto.encrypt]** or sign some message using **[crypto.sign]**

The **[crypto.encrypt]** slot requires some message/content, a signing key, an encryption key, and your signing
key's fingerprint. This slot will first cryptographically sign your message using the private key. Then it
will use the public key supplied to encrypt the message, while injecting the fingerprint for the signing key
and the cryptography key into the package. Below is an example.

```
// Recipient's key.
crypto.rsa.create-key
   strength:512

// Sender's key.
crypto.rsa.create-key
   strength:512

// Encrypting some message.
crypto.encrypt:Some super secret message
   encryption-key:x:././*/crypto.rsa.create-key/[0,1]/*/public
   signing-key:x:././*/crypto.rsa.create-key/[1,2]/*/private
   signing-key-fingerprint:x:././*/crypto.rsa.create-key/[1,2]/*/fingerprint

// Decrypting the above encrypted message.
crypto.decrypt:x:-
   decryption-key:x:././*/crypto.rsa.create-key/[0,1]/*/private
   verify-key:x:././*/crypto.rsa.create-key/[1,2]/*/public
```

**Notice** - We're using only 512 bit strength in the above example. Make sure you (at least) use
2048, preferably 4096 in real world usage. The **[crypto.encrypt]** slot can also optionally handle
a **[seed]** argument, which will seed the CSRNG that's used to generate a symmetric AES encryption
key. To understand what occurs in the above Hyperlambda example, let's walk through it step by step,
starting from the **[crypto.encrypt]** invocation.

1. The message _"Some super secret message"_ is first cryptographically signed using the private **[signing-key]**
2. The signed message is then AES encrypted using a CSRNG generated random key
3. The AES key from the above is then encrypted using the **[encryption-key]**, that's assumed to be the recipient's public key
4. The signing key's fingerprint is stored inside of the encrypted content, such that when the message is decrypted, the other party can verify that the signature originated from some trusted party
5. The encryption key's fingerprint is stored as bytes, prepended before the encrypted message, which allows the other party to retrieve the correct decryption key, according to what encryption key the caller encrypted the message with. To retrieve a cryptography operation key fingerprint, you can use **[crypto.get-key]**

Hence, the *only* thing that is in plain sight in the above encrypted message, is the fingerprint of the public
key that was used to encrypt the message. Only after the message is decrypted, the signature for the message
can be retrieved, together with the fingerprint of the key that was used to sign the message. Hence, what would
normally be a more complete process, is that after the receiver decrypts the message, he should also verify that
the signature originates from some trusted party. This can be done by simply *omitting* the **[verify-key]** argument
as you invoke **[crypto.decrypt]**, and then invoke **[crypto.get-key]** on the result of the decryption process,
for then to use the result of **[crypto.get-key]** to lookup the public key used to *verify* the signature of the
package.

```
// Recipient's key.
crypto.rsa.create-key
   strength:512

// Sender's key.
crypto.rsa.create-key
   strength:512

// Encrypting some message.
crypto.encrypt:Some super secret message
   encryption-key:x:././*/crypto.rsa.create-key/[0,1]/*/public
   signing-key:x:././*/crypto.rsa.create-key/[1,2]/*/private
   signing-key-fingerprint:x:././*/crypto.rsa.create-key/[1,2]/*/fingerprint

// Decrypting the above encrypted message.
crypto.decrypt:x:-
   decryption-key:x:././*/crypto.rsa.create-key/[0,1]/*/private
   
// Uncomment this line to retrieve signing key's fingerprint
// That you can use to lookup the public key needed to verify
// the signature
// crypto.get-key:x:-

// Verifying signature of encrypted message.
crypto.verify:x:@crypto.decrypt
   public-key:x:././*/crypto.rsa.create-key/[1,2]/*/public
```

Only after the message is verified, the actual content of the message is possible to read, as the
value of the **[crypto.verify]** slot - Unless you pass in a **[verify-key]** during the invocation
to **[crypto.decrypt]**, at which point that key will be used to verify the signature of the message,
after the package has been decrypted.
If the above invocation to **[crypto.verify]** does not throw an exception, we know for a fact that
the message was cryptographically signed with the private key that matches its **[public-key]** argument.
Normally the fingerprint of the sender's key is asssociated with some sort of _"authorization object"_
to elevate the rights of the user, only *after* having verified the message originated from a trusted
party.

Hence, from the caller's perspective it's *one* invocation to encrypt and sign a message. From the receiver's
perspective it's normally *two* steps to both decrypt and verify the integrity of a message, unless you know who
the message originated from, and you've already loaded the correct public key to verify the signature of
the message.

**Notice** - We're using only 512 bit strength in the above example. Make sure you (at least) use
2048, preferably 4096 in real world usage.

### The encryption format

The encrypted package has the following format.

1. Signing key's fingerprint in SHA256 `byte[]` format, 32 bytes long
2. The length of the signature as `int`, 4 bytes long
3. The actual signature of the message
4. The content of the message in UTF encoded `byte[]` format

Afterwards the result from the above steps is encrypted using AES, with a random generated session key 
that is 32 bytes long. And another package is created, which is the final package, intended for being sent
to the recipient. The final encryption package has a structure as follows.

1. Encryption key's fingerprint in SHA256 `byte[]` format, 32 bytes long
2. The length of the encrypted session key as `int`, 4 bytes long
3. The encrypted session key, encrypted using the recipient's public RSA key
4. The AES encrypted content from the above signing step

Hence, only when *both* of the above lists are done, you have a final encryption package to send
to some recipient.

The other party can retrieve the encryption key used for encrypting the package, using for instance
the **[crypto.get-key]** slot on the package. Then the receiver can use his private RSA key to decrypt
the AES key, and use the decrypted AES key to decrypt the rest of the package - Which will result in getting the
fingerprint of the RSA key used to sign the package, then the signature, and only *then* the content of
the message. However, all of these steps are done automatically if you use the **[crypto.decrypt]** slot,
except the signature verification process, unless you provide a **[verify-key]** argument to the decryption
process.

The AES key is generated using Bouncy Castle's `SecureRandom` implementation, resulting in a 256 bit
cryptography key. This key again is encrypted using whatever bit strength you selected as you created
your RSA key pair. Hence, the message as a whole, is not stronger than whatever key strength you use
as you supply a **[strength]** argument to the **[crypto.rsa.create-key]**.

The above format results in that the only _"meta information"_ an adversary can possibly pick up, is
the fingerprint of the public RSA key used to encrypt the AES key, in addition to also the bit strength
of this RSA key, since the bit strength of an RSA key will result in differences in the length of the
encrypted AES key. An adversary will not have access to who encrypted/transmitted the package, he will
not know who, if any signed the package - Or any other parts of the message - Assuming he is not able
to somehow crack the AES encryption, and/or somehow retrieve the private RSA key the AES package's
encryption key was encrypted with.

## Blowfish password hashing

As a general security rule of thumb, passwords should never be stored in clear text, but persisted into for
instance a database as _"slowly hashed values with per record based salts"_. This prevents a whole range of
security issues, such as having adversaries creating Rainbow Dictionary attacks on your passwords. This
project contains two slots to implement this, and these are as follows.

* __[crypto.password.hash]__ - Creates a password hash
* __[crypto.password.verify]__ - Verifies a hashed password

Example usage can be found below.

```
crypto.password.hash:SomePasswordHere

crypto.password.verify:SomePasswordHere
   hash:x:@crypto.password.hash
```

The first slot invocation creates a Blowfish hash, while the second slot invocation verifies a previously
created Blowfish hash, given the password as its main argument. If you exchange the second password given
to **[crypto.password.verify]** by for instance adding one random character to it, the result will be
`false` from the second invocation.
Internally these are the slots Magic uses when it creates its JWT authentication database, and stores
passswords into your Magic database.

