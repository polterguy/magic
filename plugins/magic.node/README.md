---
title: magic.node
---

magic.node is a simple name/value/children graph object, in addition to a _"Hyperlambda"_ parser, allowing you to
create a textual string representations of graph objects easily transformed to its relational graph object syntax
and vice versa. This allows you to declaratively create _"execution trees"_ using a format similar to YAML, for 
then to access each individual node, its value, name and children from your C#, CLR code, or Hyperlambda.

Hyperlambda is perfect for creating a highly humanly readable relational configuration format, or smaller
DSL engines, especially when combined with magic.signals and magic.lambda. Below is a small
example of Hyperlambda to give you an idea of how it looks like.

```
foo:bar
foo:int:5
foo
   child1:its-value
   child2:its-value
```

3 spaces (SP) opens up the children collection of a node, and allows you to create children associated with
some other node. In the example above, the **[child1]** and the **[child2]** nodes, have **[foo]** as their
parent. A colon `:` separates the name and the value of the node - The name is to the left of the colon, and
the value to the right.
You can optionally supply a type between a node's name and its value, which you can see above where we add
the `:int:` parts between one of our **[foo]** nodes' name and value. If you don't explicitly declare a type
`string` will be assumed.

## Traversing Hyperlambda from C#

To traverse the nodes later in for instance C#, you could do something such as the following.

```csharp
var root = HyperlambdaParser.Parse(hyperlambda);

foreach (var idxChild in root.Children)
{
   var name = idxChild.Name;
   var value = idxChild.Value;
   /* ... etc ... */
}
```

**Notice** - When you parse Hyperlambda a _"root node"_ is explicitly created wrapping all your nodes, and
this is the node that's returned to you after parsing. All nodes you declare in your Hyperlambda will be
returned to you as children of this root node.

## Hyperlambda types

Although the node structure itself can hold any value type you need inside of its `Value` property,
Hyperlambda only supports serialising the following types by default.

* `string` = System.String
* `short` = System.Int16
* `ushort` = System.UInt16
* `int` = System.Int32
* `uint` = System.UInt32
* `long` = System.Int64
* `ulong` = System.UInt64
* `decimal` = System.Decimal
* `double` = System.Double
* `single` = System.Single
* `float` = System.Single - Alias for above
* `bool` = System.Boolean
* `date` = System.DateTime - _Always_ interpreted and serialized as UTC time!
* `time` = System.TimeSpan
* `guid` = System.Guid
* `char` = System.Char
* `byte` = System.Byte
* `sbyte` = System.SByte
* `x` = magic.node.extensions.Expression
* `node` = magic.node.Node

The type declaration should be declared in your Hyperlambda in between the name and its value, separated by colon (:).
The default type if omitted is `string` and strings do not need quotes or double quotes for this reason. An example
of declaring a couple of types associated with a node's value can be found below.

```
.foo1:int:5
.foo2:bool:true
.foo3:string:foo
.foo4:bar
```

### Extending the Hyperlambda type system

The type system is extendible, and you can easily create support for serializing your own types, by using
the `Converter.AddConverter` method, that can be found in the `magic.node.extensions` namespace.
Below is an example of how to extend the typing system, to allow for serializing and de-serializing instances
of a `Foo` class into Hyperlambda.

```csharp
/*
 * Class you want to serialize into Hyperlambda.
 */
class Foo
{
    public int Value1 { get; set; }
    public decimal Value2 { get; set; }
}

/*
 * Adding our converter functions, and associating them
 * with a type, and a Hyperlambda type name.
 */
Converter.AddConverter(
    typeof(Foo),
    "foo",
    (obj) => {
        var foo = obj as Foo;
        return ("foo", $"{foo.Value1}-{foo.Value2}");
    }, (obj) => {
        var str = (obj as string).Split('-');
        return new Foo
        {
            Value1 = int.Parse(str[0]),
            Value2 = decimal.Parse(str[1]),
        };
    });
```

The above will allow you to serialize instances of `Foo` into your Hyperlambda, and
de-serialize these instances once needed. An example of adding a `Foo` instance into
your Hyperlambda can be found below.

```
.foo:foo:5-7
```

Later you can retrieve your `Foo` instances in your slots, using something
resembling the following, and all parsing and conversion will be automatically
taken care of.

```
var foo = node.Get<Foo>();
```

## String literals in Hyperlambda

Hyperlambda also supports strings the same way C# supports strings, using any of the following string representations.

```
// Single quotes
.foo:'howdy world this is a string'

// Double quotes
.foo:"Howdy world, another string"

// Multiline strings
.foo:@"Notice how the new line doesn't end the string
    here!"
```

Escape characters are supported for both single quote and double quote strings the same way they
are supported in C#, allowing you to use e.g. `\r\n` etc.

## Lambda expressions

Lambda expressions are kind of like XPath expressions, except they will reference nodes
in your Node graph object instead of XML nodes. Below is an example to give you an idea.

```
.foo:hello world
get-value:x:@.foo

// After invocation of the above **[get-value]**, its value will be "hello world".
```

Most slots in Magic can accept expressions to reference nodes, values of nodes, and children of
nodes somehow. This allows you to modify the lambda graph object, as it is currently being executed,
and hence allows you to modify _"anything"_ from _"anywhere"_. This resembles XPath expressions
from XML.

### Iterators in lambda expressions

An expression is constructed from one or more _"iterator"_. This makes an expression
become _"dynamically chained Linq statements"_, where each iterator reacts upon
the results of its previous iterator. Each iterator takes as input an `IEnumerable`,
and returns as its result another `IEnumerable`, where the content of the iterator
somehow changes its given input, according to whatever the particular iterator's
implementation does. This approach just so happens to be perfect for retrieving
sub-sections of graph objects.

Each iterator ends with a _"/"_ or a CR/LF
sequence, and before its end, its value defines what it does. For instance the above iterator in
the __[get-value]__ invocation, starts out with a _"@"_. This implies that the iterator will find the
first node having a name of whatever follows its _"@"_. For the above this implies looking for the first
node who's name is _".foo"_. To see a slightly more advanced example, imagine the following.

```
.data
   item1:john
   item2:thomas
   item3:peter
get-value:x:@.data/*/item2
```

It might help to transform the above expression into humanly readable language. Its
English equivalent hence becomes as follows.

> Find the node with the name of '.data', then retrieve its children, and filter away everything not having a name of 'item2'

Of course, the result of the above becomes _"thomas"_.

Below is a list of all iterators that exists in magic. Substitute _"xxx"_ with a string,
_"n"_ with a number, and _"x"_ with an expression.

* `*` Retrieves all children of its previous result
* `#` Retrieves the value of its previous result as a node by reference
* `-` Retrieves its previous result set's _"younger sibling"_ (previous node)
* `+` Retrieves its previous result set's _"elder sibling"_ (next node)
* `.` Retrieves its previous result set's parent node(s)
* `^xxx` Retrieves the first ancestor node with the specified _"xxx"_ name. Similar to `@` iterator but does not traverse siblings, only direct ancestors up in hierarchy
* `..` Retrieves the root node
* `**` Retrieves its previous result set's descendant, with a _"breadth first"_ algorithm
* `--` Retrieves all ancestors and older siblings upwards in object
* `!xxx` Traverses all descendants except those matching specified _"xxx"_ name and returns
* `{x}` Extrapolated expression that will be evaluated assuming it yields one result, replacing itself with the value of whatever node it points to
* `=xxx` Retrieves the node with the _"xxx"_ value, converting to string if necessary
* `[n,n]` Retrieves a subset of its previous result set, implying _"skip, count"_, or _"offset, count"_
* `@xxx` Returns the first node _"before"_ in its hierarchy that matches the given _"xxx"_ in its name
* `n` (any number) Returns the n'th child of its previous result set
* `[x|y]` Pipe separated list of names returning all nodes having a name of either _"x"_ or _"y"_

Notice, you can escape iterators by using backslash "\\". This allows you to look for nodes who's names
are for instance _"3"_, without using the n'th child iterator, which would defeat the purpose. In addition,
you can quote iterators by using double quotes `"`, to allow for having iterators with values that are normally
not legal within an iterator, such as `/`, etc. If you quote an iterator you have to quote the entire expression.
Below is an example of a slightly more advanced expression.

```
.foo
   howdy:wo/rld
   jo:nothing
   howdy:earth
.dyn:.foo
for-each:x:@"./*/{@.dyn}/*/""=wo/rld"""
   set-value:x:@.dp/#
      :thomas was here
```

After evaluating the above Hyperlambda, the value of all nodes having _"wo/rld"_ as their value
inside of **[.foo]** will be updated to become _"thomas was here"_. Obviously, the above expression
is a ridiculously complex example, that you will probably never encounter in your own code. However,
for reference purposes, let's break it down into its individual parts.

1. Get parent node
2. Get all children
3. Filter away everything not having the name of the value of `{@.dyn}`, which resolves to the equivalent of `:x:@.dyn`, being an expression, who's result becomes _".foo"_.
4. Get its children
5. Find all nodes who's value is _"wo/rld"_.

98% of your expressions will have 1-3 iterators, no complex escaping, and no parameters.
And in fact, there are thousands of lines of Hyperlambda code in Magic's middleware, and
98% of these expressions are as simple as follows.

```
.arguments
   foo1:string
get-value:x:@.arguments/*/foo1
```

Which translates into the following English.

> Give me the value of any **[foo1]** nodes, inside of the first **[.arguments]** node you can find upwards in the hierarchy.

Expressions can also be extrapolated, which allows you to parametrise your expressions, by nesting
expressions, substituting parts of your expression dynamically as your code is executed. Imagine
the following example.

```
.arg1:foo2
.data
   foo1:john
   foo2:thomas
   foo3:peter
get-value:x:@.data/*/{@.arg1}
```

The above expression will first evaluate the `{@.arg1}` parts, which results in _"foo2"_, then evaluate the
outer expression, which now will look like this `@.data/*/foo2`. You can also extrapolate expressions on
values, such as illustrated below.

```
.arg1:thomas
.data
   foo1:john
   foo2:thomas
   foo3:peter
get-name:x:@.data/*/={@.arg1}
```

### Extending lambda expressions/iterators

You can easily extend expressions in Magic, either with a _"static"_ iterator, implying
a direct match - Or with a dynamic parametrized iterator, allowing you to create iterators that
requires _"parameters"_. To extend the supported iterators, use any of the following two static
methods.

* `Iterator.AddStaticIterator` - Creates a _"static"_ iterator, implying a direct match.
* `Iterator.AddDynamicIterator` - Creates a _"dynamic iterator create function"_.

Below is a C# example, that creates a dynamic iterator, that will only return nodes having a value,
that once converted into a string, has _exactly_ `n` characters, not less and not more.

```csharp
Iterator.AddDynamicIterator('%', (iteratorValue) => {
    var no = int.Parse(iteratorValue.Substring(1));
    return (identity, input) => {
        return input.Where(x => x.Get<string>()?.Length == no);
    };
});

var hl = @"foo
   howdy1:XXXXX
   howdy2:XXX
   howdy3:XXXXX
";
var lambda = HyperlambdaParser.Parse(hl);

var x = new Expression("../**/%3");
var result = x.Evaluate(lambda);
```

Notice how the iterator we created above, uses the `%3` parts of the expression, to parametrize
itself. If you exchange 3 with 5, it will only return **[howdy1]** and **[howdy3]** instead,
since it will look for values with 5 characters instead. The `Iterator` class can be found
in the `magic.node.extensions` namespace.
You can use the above syntax to override the default implementation of iterators, although
I wouldn't recommend it, since it would create confusion for others using your modified version.

**Notice** - To create an extension iterator is an exercise you will rarely if _ever_ need to do,
but is included here for reference purposes.

### Parsing Hyperlambda from C#

Magic allows you to easily parse Hyperlambda from C# if you need it, which can be done as follows.

```csharp
using magic.node.extensions.hyperlambda;

var hl = GetHyperlambdaAsString();
var lambda = HyperlambdaParser.Parse(hl);
```

The `GetHyperlambdaAsString` above could for instance load Hyperlambda from a file, retrieve it
from your network, or some other way retrieve a snippet of Hyperlambda text. The `HyperlambdaParser.Parse`
parts above will return your Hyperlambda as its `Node` equivalent. The `Parser` class also has an
overloaded constructor for taking a `Stream` instead of a `string`.

**Notice** - The `Node` returned above will be a root node, wrapping all nodes found in your
Hyperlambda as children nodes. This is necessary in order to avoid enforcing a single _"document node"_
the way XML does.
Once you have a `Node` object, you can easily reverse the process by using the `HyperlambdaGenerator`
class, and its `GetHyperlambda` method such as the following illustrates.

```csharp
using magic.node.extensions.hyperlambda;

var hl1 = GetHyperlambdaAsString();
var result = HyperlambdaParser.Parse(hl1);
var hl2 = HyperlambdaGenerator.GetHyperlambda(result.Children);
```

## Documenting nodes, arguments to slots, etc

When referencing nodes in the documentation for Magic, it is common to reference them like __[this]__, where
_"this"_ would be the name of some node - Implying in __bold__ characters, wrapped by square [brackets].

