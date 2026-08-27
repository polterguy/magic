---
title: magic.lambda.dates
---

This project contains date manipulation slots for Magic. More specifically, this project contains the following slots.

* __[date.now]__ - Returns the now date, equivalent of `DateTime.Now`.
* __[date.from-unix]__ - Converts the specified Unix timestamp to a `DateTime` object.
* __[date.min]__ - Returns the minimum date value, equivalent of `DateTime.MinValue`.
* __[date.format]__ - Returns a string representation of some date, formatted according to the specified **[format]** argument.
* __[time]__ - Creates a time span, useful for adding and subtracting offsets to date objects. Pass in **[days]**, **[hours]**, **[minutes]**, **[seconds]** or **[milliseconds]** to declare how large your offset is. All arguments are optional, but (of course) at least one argument should be passed in.

**Notice** - Internally in Magic, everything is UTC Universal timezone, implying if you want to render it in user's
timezone, you'll have to convert it explicitly in your client/frontend. All dates and times internally in  Magic,
also those stored into any database, are treated as UTC timezone. All dates transmitted _to_ the backend, is also
assumed to be UTC. This is to make things simple in regards to interacting with database systems, that may or may not
add support for timezone offsets.
Below is an example of taking the current date and time, and adding two days and one second to it, for then to
format the result as a string.

```
math.add
   date.now
   time
      days:2
      second:1

date.format:x:-
   format:"yyyy-MM-dd HH:mm:ss"
```

## How to use [date.now]

This slot takes no arguments and simply returns the current date and time. Basic usage can be found below.

```
date.now
```

## How to use [date.from-unix]

This slot takes a Unix date and time stamp, and returns a typed date object as its result. Below is an example.

```
date.from-unix:1674132584
```

## How to use [date.min]

This slot simply returns the minimum value a date and time object can hold. Usage can be found below.

```
date.min
```

## How to use [date.format]

This slot formats a date and time object as a string. Patterns are the same as patterns for C#. Below is
example usage.

```
date.format:date:"2023-01-19T12:49:44.000Z"
   format:dd. MMMM yyyy
```

## How to use [time]

This slot returns a time object, which is useful for doing math operations with a date and time object,
allowing you to for instance subtract 5 days from the current date and time. Below is an example.

```
time
   days:5
```

This slot can be given the following arguments;

- **[days]** - Number of days
- **[hours]** - Number of hours
- **[minutes]** - Number of minutes
- **[seconds]** - Number of seconds
- **[milliseconds]** - Number of milliseconds
