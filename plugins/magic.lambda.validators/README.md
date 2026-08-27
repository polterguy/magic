---
title: magic.lambda.validators
---

This project contains argument validators for Hyperlambda. More specifically it contains the following slots.

* __[validators.date]__ - Verifies that some date input is a date, and optionally between __[min]__ and __[max]__ value
* __[validators.email]__ - Verifies that some input is a legal email address
* __[validators.enum]__ - Verifies that some input is one of a set of predefined legal values, found as values of children
* __[validators.integer]__ - Verifies that some integer input (long, int, etc) is between some specified __[min]__ and __[max]__ range
* __[validators.mandatory]__ - Verifies that some input valus is given (_at all_)
* __[validators.regex]__ - Verifies that some input is matching some given __[regex]__ pattern
* __[validators.string]__ - Verifies that some string input is between __[min]__ and __[max]__ in length
* __[validators.url]__ - Verifies that some string input is a legal URL, either HTTP or HTTPS type of scheme
* __[validators.recaptcha]__ - reCAPTCHA validator, to avoid bots from invoking your APIs
* __[validators.default]__ - Default validator, adding default argument if not specified

All of the above slots takes an expression, or values, as its main input, and will throw exceptions if their input expression's
value(s), or its value, does not follow the rules specified by the validator. Some of the above slots takes additional arguments.
This makes them perfect fits for _"intercepting"_ the input specified to an HTTP REST endpoint, to verify the input data conforms
to some sort of predefined validation scheme.

## Commonalities between validators

```
.foo
   email:foo@bar.com
validators.email:x:@.foo/*/email
```

Most Hyperlambda validators requires some sort of argument(s) - However, some of
these validators does not require arguments, such as the email validator, that simply verifies the input is a valid email address.
To use the **[validators.regex]** validator, you should probably [learn regular expression](https://medium.com/factory-mind/regex-tutorial-a-simple-cheatsheet-by-examples-649dc1c3f285). However, this is beyond the scope of this article.

**Notice** - No attempt to invoke the type validator logic will be done unless the value is a _non null_ value. If you want
to enforce such logic, you'll have to combine the specific type validators with the **[validators.mandatory]** validator,
that enforces that a value must be specified and not have a null value.

### How to use [validators.date]

This slot works similarly to the **[validator.integer]** validator, except instead of providing a min/max
integer value, you're expected to provide a min/max _date_ value. Below is an example of how you could use
it.

```
validators.date:x:@.arguments/*/date
   min:date:"2005-01-21T23:59:47"
   max:date:"2023-01-21T23:59:47"
```

### How to use [validators.email]

This slot takes no arguments besides an expression, and will throw an exception unless the value of the node
the expression is leading to is a valid email address. Below is example usage.

```
.arg:foo@bar.com
validators.email:x:@.arg
```

### How to use [validators.enum]

This validator will throw an exception unless the specified string argument is one of the legal values. Usage
could be as follows.

```
validators.enum:x:@.arguments/*/enum_value
   .:val1
   .:val2
```

If the above **[enum_value]** is not either `val1` or `val2` the validator will throw an exception.

### How to use [validators.integer]

This value takes a **[min]** and **[max]** value, both of which are optional, and declares the minimum, and/or
maximum value of the integer input. Usage could be as follows.

```
validators.integer:x:@.arguments/*/some-integer-argument
   min:50
   max:100
```

If the specified integer value is not within the range of the min and max value, an exception will be thrown.

### How to use [validators.mandatory]

This slot simply throws an exception if the specified argument is not supplied. Below is example
usage.

```
validators.mandatory:x:@.arguments/*/mandatory_arg
```

### How to use [validators.regex]

This validator requires a **[regex]** argument, that is a regular expression that must match the argument
specified. Usage can be found below.

```
.arguments
   foo:howdy world
validators.regex:x:@.arguments/*/foo
   regex:howdy
```

If you remove the _"howdy"_ parts of your above argument, an exception will be thrown.

### How to use [validators.string]

This works the same way as the **[validators.integer]** validator, except instead of being a min/max
_value_ the min/max arguments declares the minimum and maximum _length_ of the string, allowing you
to restrict string length of arguments to a min/max value for your Hyperlambda. Below is example
usage that will throw an exception unless the argument is between 5 and 15 characters in length.

```
validators.string:x:@.some-arg
   min:5
   max:15
```

### How to use [validators.url]

This is similar to the **[validators.email]** slot, except it requires the argument to be a valid
URL instead of a valid email. Below is example usage.

```
validators.url:x:@.some-url
```

### How to use [validators.recaptcha]

This is probably the most complex validator, and requires 3 arguments.

* __[site-key]__ - Site key as provided to you by Google's reCAPTCHA admin panel
* __[secret]__ - Secret as provided to you by Google's reCAPTCHA admin panel
* __[min]__ - Minimum value, a decimal value between 0 and 1. A good value here is typically 0.3

To use this validator you will need a Google reCAPTCHA account, version 3, at which point you can use it as
follows.

```
validators.recaptcha:x:@.arguments/*/recaptcha_value
   site-key:xyz
   secret:qwerty
   min:decimal:0.3
```

### How to use [validators.default]

This validator takes one or more arguments with any name and any value, and if this node does not exist as
a child of the node collection specified as its expression value, it appends the node to it.
If the node exists but has a null value, it sets its value to the value of the argument.


```
.arguments
validators.default:x:@.arguments
   foo1:bar1
```

## Validator internals

You can use one invocation to any of the validators to validate multiple nodes, such as the following illustrates.

```
.arguments
   .
      no:5
   .
      no:10
   .
      // Throws if you remove the "."
      .no:11

validators.integer:x:@.arguments/*/*/no
   min:5
   max:10
```

First the above expression will be evaluated, then *every* resulting value will be validated, and if *any* of them are
not validated according to the validator's arguments - Which for the above example is number between 5 and 10 - The
validater will throw an exception, providing the invalid value, and the name of the last iterator (effectively being the argument name)
to the caller. This allows you to use *one single validator* to validate multiple arguments, such as the above illustrates.
This might be useful if you for instance have an endpoint accepting multiple address fields, and zip code is a mandatory
argument, and it needs to be an integer with a **[max]** and **[min]** value.

