---
title: magic.lambda.math
---

This project provides math functions to Magic. More specifically, it provides the following slots.

* __[math.multiply]__ - Multiplication
* __[math.divide]__ - Division
* __[math.add]__ - Addition
* __[math.subtract]__ - Subtraction
* __[math.modulo]__ - Modulo
* __[math.decrement]__ - Decrements a node's value, optionally by **[step]**, defaulting to 1
* __[math.increment]__ - Increments a node's value, optionally by **[step]**, defaulting to 1
* __[math.dot]__ - Returns the dot product of two lists, where each list must be a `double` value
* __[math.max]__ - Returns the max value
* __[math.min]__ - Returns the min value

All of the above besides the two last slots can be given any number of arguments, including as its value,
and will treat the first argument as the _"base"_, and performing the rest of the arguments self assigning
the base as it proceeds. For instance, the following code will first divide 100 by 4, then divide that result
by 5 again, resulting in 5.

```
math.divide:int:100
   :int:4
   :int:5
```

The value of the above __[math.divide]__ node after evaluating the above Hyperlambda will be 5.
All of the above slots will also evaluate the children collection as a lambda, before starting the actual math function,
allowing you to recursively raise signals to retrieve values that are supposed to be mathematically handled somehow.
This allows you to recursively nest math operations, such as for instance.

```
.one:int:5
.two:int:2

math.multiply
   .:int:3
   math.add
      get-value:x:@.one
      get-value:x:@.two
```

The above of course will first add 5 and 2, then multiply the result of that with 3, resulting in 21.

## Incrementing and decrementing values

The above **[math.increment]** and **[math.decrement]** slots, will instead of yielding a result, inline modify the
value of the node(s) it is pointing to, assuming its value is an expression. In addition these two slots can take an
_optional_ _"step"_ argument, allowing you to declare how much the incrementation/decrementation process should add/reduce
the original node's value by. Below is an example that decrements the value found in its expression by 2.

```
.value:int:5

math.decrement:x:-
   .:int:2
```

After executing the above, the result of **[.value]** will be 3. The default _"step"_ value if omitted will be 1.
Below is an example.

```
.value:int:5

math.increment:x:-
```

**Notice** - You can use any slot invocation to retrieve the step value for the increment/decrement slots, including
for instance an invocation to **[get-value]**, or your custom slots. This is due to the fact that the first argument supplied
to these slots will be assumed to be the _"step"_ value you want.

## How to use [math.multiply]

This slot multiplies two or more values with each other, and can be given as many arguments as you wish,
such as the following illustrates.

```
.arg:int:5
math.multiply
   get-value:x:@.arg
   .:int:3
```

It accepts both slot invocations, retrieving some value by invoking a slot, in addition to static values such as
illustrated above where we provide the number 3 as one of its values.

## How to use [math.divide]

This slot divides two or more values with each other, and can be given as many arguments as you wish,
such as the following illustrates.

```
.arg:int:5
math.divide
   get-value:x:@.arg
   .:int:2
```

It accepts both slot invocations, retrieving some value by invoking a slot, in addition to static values such as
illustrated above where we provide the number 2 as one of its values.

## How to use [math.add]

This slot adds two or more values with each other, and can be given as many arguments as you wish,
such as the following illustrates.

```
.arg:int:5
math.add
   get-value:x:@.arg
   .:int:2
```

## How to use [math.subtract]

This slot subtracts two or more values with each other, and can be given as many arguments as you wish,
such as the following illustrates.

```
.arg:int:5
math.subtract
   get-value:x:@.arg
   .:int:2
```

It accepts both slot invocations, retrieving some value by invoking a slot, in addition to static values such as
illustrated above where we provide the number 2 as one of its values.

## How to use [math.modulo]

This slot calculates the modulo of two or more values with each other, and can be given as many arguments as you wish,
such as the following illustrates.

```
.arg:int:5
math.modulo
   get-value:x:@.arg
   .:int:2
```

It accepts both slot invocations, retrieving some value by invoking a slot, in addition to static values such as
illustrated above where we provide the number 2 as one of its values.

## How to use [math.decrement]

This slot decrements the value of some expression in place, by mutating the value of the node its expression is
leading to.

```
.arg:int:5
math.decrement:x:@.arg
```

It can optionally be given a **[step]** argument, such as illustrated below.

```
.arg:int:5
math.decrement:x:@.arg
   .:int:2
```

## How to use [math.increment]

This slot increments the value of some expression in place, by mutating the value of the node its expression is
leading to.

```
.arg:int:5
math.increment:x:@.arg
```

It can optionally be given a **[step]** argument, such as illustrated below.

```
.arg:int:5
math.increment:x:@.arg
   .:int:2
```

## How to use [math.min]

This slot returns the min value of its input.

```
math.min
   .:int:5
   .:int:7
```

## How to use [math.max]

This slot returns the max value of its input.

```
math.max
   .:int:11
   .:int:12
```

## How to use [math.dot]

This slot returns the dot product of two lists.

```
.list1
   .:double:0.5
   .:double:0.7
   .:double:0.1
.list2
   .:double:0.56
   .:double:0.89
   .:double:0.33
math.dot
   get-nodes:x:@.list1/*
   get-nodes:x:@.list2/*
```

This slot is useful for calculating similarities between two different objects in Machine Learning, where
each list is an _"embedding"_ or a vector.


## How to use [math.abs]

This slot returns the absolute value of its input, implying its positive counterpart if the value is negative, or unchanged if it's already positive.

```
math.abs:x:@.arguments/*/number
```


## How to use [math.sqrt]

This slot returns the square root of its input.

```
math.sqrt:x:@.arguments/*/number
```


## How to use [math.sin]

This slot returns the sin value of its input.

```
math.sin:x:@.arguments/*/number
```


## How to use [math.cos]

This slot returns the cos value of its input.

```
math.cos:x:@.arguments/*/number
```
