---
title: magic.lambda.strings
---

This project contains string manipulation slots for Magic. More specifically, it gives you the following slots.

* __[strings.replace]__ - Replaces occurrences of the specified argument with the value of its specified argument
* __[strings.replace-not-of]__ - Replaces all characters found in string, except those found in its single argument
* __[strings.capitalize]__ - Turns the first character in your string into a CAPS
* __[strings.concat]__ - Concatenates two or more strings
* __[strings.contains]__ - Returns true if specified string contains the given argument
* __[strings.ends-with]__ - Returns true if the specified string ends with the specified argument
* __[strings.starts-with]__ - Returns true if the specified string starts with its argument
* __[strings.join]__ - Joins multiple strings together, with a separating string between each string joined
* __[strings.length]__ - Returns the length in characters of the given string
* __[strings.regex-replace]__ - Replaces occurrences matching the given regular expression with its argument
* __[strings.split]__ - Splits a string into multiple strings on every match of its given argument
* __[strings.to-lower]__ - Returns the lower caps version of its given argument
* __[strings.to-upper]__ - Returns the upper caps version of its specified argument
* __[strings.trim]__ - Trims a string, optionally for all characters found in its argument
* __[strings.trim-start]__ - Trims a string only to its left, optionally for all characters found in its argument
* __[strings.trim-end]__ - Trims a string only to its right, optionally for all characters found in its argument
* __[strings.url-encode]__ - URL encodes the specified string
* __[strings.url-decode]__ - URL decodes the specified string
* __[strings.substring]__ - Returns the sub-string of the specified string
* __[strings.matches]__ - Returns the regular expression matches found from specified source
* __[strings.mixin]__ - Allows for mixin logic of strings and Hyperlambda

## Usage

All the above slots that require two arguments, will use the first argument as its _"what"_ argument, and the second
as its _"with"_ argument. Avoiding naming these though, allows you to reference other slots, and use these as sources
to parametrize your invocations to the above slots. Below is an example of how this would look like.

```
.data:Hyperlambda is cool

strings.replace:x:-
   .:cool
   .:super cool
```

### How to use [strings.replace]

This slot replaces occurrences of a string inside a string, with some other string. The simplest version is like
follows.

```
.foo:thomas hansen

strings.replace:x:-
   .:hansen
   .:tjobing hansen
```

You can also reference slots and dynamic slots for that matter, assuming your slots somehow returns strings,
or something that can be converted into a string, such as the following illustrates. Notice, this code will
throw an exception, since there are probably no slots called _"some-slot-returning-string"_ in your installation.

```
.what:hansen
.foo:thomas hansen

strings.replace:x:-

   get-value:x:@.what

   signal:some-slot-returning-string
      arg1-to-slot:foo
      arg2-to-slot:foo
```

Above the first argument is _"what to look for"_, and the second argument is _"what to substitute it with"_.
The above is a general pattern for most of these slots, where the node arguments supplied to the slot will be
evaluated as a lambda object, before the arguments are consumed, allowing you to use arguments that are the
result of invoking other slots as arguments to your original outer most slot.

### How to use [strings.replace-not-of]

This slot will replace every single character in your original string, that cannot be found in its first
argument, with the value of its second argument. This slot is useful if you want to remove all characters
that cannot be found in another character set, such as the following illustrates.

```
strings.replace-not-of:foo bar1howdy
   .:abcdefghijklmnopqrstuvwxyz
   .:-
```

The above will result in the following result 

```
strings.replace-not-of:foo-bar-howdy
```

### How to use [strings.capitalize]

Turns the first character of your string into a CAPS character.

```
strings.capitalize:thomas

/*
 * Resulting in "Thomas" after invocation.
 */
```

### How to use [strings.concat]

Concatenates a list of strings into one string. Similar to **[strings.join]**, except it doesn't take a
separating character.

```
.bar:Bar
strings.concat
   .:Thomas
   .:" "
   .:Hansen
   .:" "
   .:Foo
   .:" "
   get-value:x:@.bar

/*
 * Resulting in "Thomas Hansen Foo Bar" after invocation.
 */
```

### How to use [strings.contains]

Returns true if the specified string contains some sequence of characters.

```
// Returns true
strings.contains:Thomas Hansen Is Cool
   .:Hansen
```

### How to use [strings.ends-with]

Returns true if the specified string ends with some sequence of characters.

```
// Returns true
strings.ends-with:Thomas Hansen Is Cool
   .:Cool

// Returns false
strings.ends-with:Thomas Hansen Is Coolio
   .:Cool
```

### How to use [strings.starts-with]

Returns true if the specified string starts with some sequence of characters.

```
// Returns true
strings.starts-with:Thomas Hansen Is Cool
   .:Thomas

// Returns false
strings.starts-with:Thomas Hansen Is Cool
   .:Hansen
```

### How to use [strings.join]

Similar to **[strings.concat]**, except it also takes an optional separating character, allowing you to
concatenate a bunch of strings, and making sure each original string is separated by some sequence of strings.

```
.src
   .:foo
   .:bar
strings.join:x:@.src/*
   .:,

/*
 * Results in "foo,bar"
 */
```

### How to use [strings.length]

Returns the length of a string as an integer number.

```
// Returns 6
strings.length:thomas
```

### How to use [strings.regex-replace]

Replaces matches of the given regular expression with some static sequence of characters.

```
// Results in "FOO bar hansen"
strings.regex-replace:foo bar hansen
   .:fo+
   .:FOO
```

The first argument is what regular expression to match, the second argument is what to replace
all matches with.

### How to use [strings.split]

Splits a string into multiple strings, where a sequence of characters can be found, removing the original
sequence of characters from the resulting node set.

```
.foo:some input string
strings.split:x:-
   .:' '
```

The above will result in the following result.

```
.foo:some input string
strings.split:x:-
   .:some
   .:input
   .:string
```

### How to use [strings.to-lower]

Turns every single character in your input string into a lowercase character.

```
strings.to-lower:Thomas Hansen Is Cool

// Results in "thomas hansen is cool"
```

### How to use [strings.to-upper]

Turns every single character in your input string into a UPPER case character.

```
strings.to-upper:Thomas Hansen Is Cool

// Results in "THOMAS HANSEN IS COOL"
```

### How to use [strings.trim], [strings.trim-start], [strings.trim-end]

Trims a string, either both sides, only the start of it, or only the end of it, for
occurrences of characters found in the sequence of characters provided as its argument.

```
strings.trim:09thomas12
   .:1234567890

// Results in "thomas"
```

### How to use [strings.url-encode]

URL encodes a string. Example can be found below.

```
strings.url-encode:thomas@ainiro.io
```

Resulting in the following after execution.

```
strings.url-encode:thomas%40ainiro.io
```

### How to use [strings.url-decode]

URL decodes a string, the opposite of **[strings.url-encode]**. Example can be found below.

```
strings.url-encode:thomas@ainiro.io
strings.url-decode:x:-
```

Resulting in the following after execution.

```
strings.url-encode:thomas%40ainiro.io
strings.url-decode:thomas@ainiro.io
```

### How to use [strings.substring]

Returns a substring of the specified string.

```
.input:Foo Bar Howdy World
strings.substring:x:-
   .:5
   .:7
```

The above will result in the following.

```
strings.substring:ar Howd
```

Notice, the second argument is the _number of characters to return_ and not the offset into the string
of where to stop returning. In such a regard, it works the same way as the C# `Substring` method.

### How to use [strings.matches]

Returns all regular expression matches from specified source string.

```
.input:Foo Bar Howdy World {match1} and {match2} and that was it
strings.matches:x:-
   .:"\\{.+?\\}"
```

The above will result in the following.

```
strings.matches
   .:{match1}
   .:{match2}
```

### How to use [strings.mixin]

Combines the result of the specified Hyperlambda and concatenates inline into its surrounding string.

```
strings.mixin:@"2+2 equals {{
math.add
   .:int:2
   .:int:2
return:x:-
}}"
```

The above will result in the following.

```
strings.mixin:2+2 equals 4
```

Notice, any inline Hyperlambda is added by adding two braces around your Hyperlambda, at which point the inline Hyperlambda will be executed, and whatever it returns is _"mixed into the surrounding string inline"_. This slot can be used similarly to **[invoke]**, allowing you to pass in parameters to it by simply adding nodes as children when invoking it. To understand the last point consider the following code.

```
strings.mixin:@"2 + val equals {{
math.add
   .:int:2
   get-value:x:@.arguments/*/val
return:x:-
}}"
   val:int:5
```

