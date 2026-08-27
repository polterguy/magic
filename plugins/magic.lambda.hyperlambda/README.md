---
title: magic.lambda.hyperlambda
---

This is the Hyperlambda parser and generator in Magic, and allows you to parse Hyperlambda, in addition
to generate Hyperlambda. More specifically, this project provides you with the following slots.

* __[hyper2lambda]__ - Transforms a piece of Hyperlambda (text) to a lambda hierarchy
* __[lambda2hyper]__ - Transforms a lambda hierarchy to Hyperlambda (text)

Using these slots, you can both easily create, serialize, and parse Hyperlambda to lambda, and vice versa.
Below is an example of parsing a piece of text as Hyperlambda, for then to dynamically execute it afterwards.

```
.hl:@"log.info:""This was logged from a piece of text"""

hyper2lambda:x:-

eval:x:-
```

You can also reverse the process, such as the following illustrates.

```
.hl
   log.info:This is some example logging invocation

lambda2hyper:x:-/*
```

The above two slots, allows you to dynamically generate plain text from a lambda structure, and vice versa,
allowing you to for instance persist execution objects and structured data into files, your database, or for
that matter transmit it over the network to another machine. Below is an example of dynamically
loading a Hyperlambda file from disc, for then to execute it. Notice, in order to have the following
snippet work, you'll need an actual file called _"foo.hl"_ inside of your backend's _"files/"_ folder.

```
io.file.load:/foo.hl

hyper2lambda:x:-

eval:x:-
```

**Notice** - Both of these slots can optionally be given a **[comments]** argument with a value of `true`,
at which point both **[lambda2hyper]** and **[hyper2lambda]** will preserve comments, and persist these as
**[..]** nodes into your lambda, and reverse the process for the other direction. This allows you to keep the
comments of your Hyperlambda parts as semantic nodes, as you handle your Hyperlambda and node hierarchy.

## How to use [hyper2lambda]

This slot creates a semantic lambda object (graph object) from the specified text. Below is an example
of usage.

```
.hl:@"log.info:""This was logged from a piece of text"""
hyper2lambda:x:-
```

The above of course produces an executable lambda object from your specified Hyperlambda text.

## How to use [lambda2hyper]

This slot creates a Hyperlambda string from your specified lambda object. This allows you to
transfer your Hyperlambda to some other server, and/or persist it to disc. Below is example
usage.

```
.hl
   log.info:This is some example logging invocation
lambda2hyper:x:-/*
```

