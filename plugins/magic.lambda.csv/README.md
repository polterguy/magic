---
title: magic.lambda.csv
---

This project provides CSV helper slots for Magic. More specifically, it provides the following slots.

* __[lambda2csv]__ - Creates a CSV string from a lambda object
* __[csv2lambda]__ - Creates a lambda object from a CSV string

## Convert from lambda to CSV and back again

```
.data
   .
      name:Thomas Hansen
      age:int:47
   .
      name:John Doe
      age:int:67

lambda2csv:x:-/*

add:x:+/*/types
   get-nodes:x:@lambda2csv/*

csv2lambda:x:@lambda2csv
   types
```

Notice, the **[lambda2csv]** slot will return type information, and the **[csv2lambda]** slot can optionally be
given type information in its **[types]** argument, allowing you to convert correctly back to the correct type(s)
as you convert a CSV string to its lambda objects. The **[lambda2csv]** slot will also create headers for your
CSV string, and the **[csv2lambda]** slot will use the first line to retrieve these headers, to rebuild the lambda
object correctly.

This allows you to roundtrip from a lambda object, to CSV format, and back to lambda again, without loosing
type information or names of your nodes. This is necessary since CSV doesn't preserve types in any ways. By
default the **[lambda2csv]** will also treat null values correctly, by adding these into the CSV file as _"[NULL]"_.
This allows you to preserve null values, which isn't really possible with CSV normally - However, for some edge
cases you might want to use  _different_ null value, at which point you can supply this as **[null-value]** argument
to both slots. If you supply a **[null-value]** argument, but set its value to _null_ - Null values will be ignored,
and no null values will be persisted in any direction.

## How to use [csv2lambda]

This slot converts a CSV string into a lambda object. In its simplest form it would resemble the following.

```
.csv:@"name,age
Thomas Hansen,47
John Doe,67"

csv2lambda:x:@.csv
```

It can optionally take a type declaration through a **[types]** argument, which allows you to add typing support
to the slot.

## How to use [lambda2csv]

This slot converts the specified lambda object to a CSV string. Below is an example of usage.

```
.data
   .
      name:Thomas Hansen
      age:int:47
   .
      name:John Doe
      age:int:67

lambda2csv:x:-/*
```

The slot will return type information as children of your **[lambda2csv]** invocation.

