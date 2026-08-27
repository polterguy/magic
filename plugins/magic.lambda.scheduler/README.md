---
title: magic.lambda.scheduler
---

This project gives you the ability to create persisted and scheduled Hyperlambda tasks
for Magic. More specifically it provides the following slots.

* __[tasks.create]__ - Creates a new task
* __[tasks.get]__ - Returns an existing task
* __[tasks.list]__ - Lists all tasks
* __[tasks.update]__ - Updates an existing task
* __[tasks.count]__ - Counts tasks in system
* __[tasks.execute]__ - Executes an existing task
* __[tasks.delete]__ - Deletes a task
* __[tasks.schedule]__ - Schedules an existing task
* __[tasks.schedule.delete]__ - Deletes an existing schedule

## How to use [tasks.create]

To create and persist a task you can use something such as the following.

```
tasks.create:foo-bar-task-1
   .lambda

      // Your task's lambda object goes here
      log.info:Executing foo-bar-task-1
```

The name or ID of your task in the above example becomes _"foo-bar-task-1"_, and the task can be referenced later
using this name. The name must be unique, otherwise an exception will be thrown. A task can also optionally have
a **[description]** argument, which is a humanly readable description, describing what your task does. Below is
an example.

```
tasks.create:foo-bar-task-2
   description:This task will do a little bit of foo and some bar afterwards.
   .lambda

      log.info:Executing foo-bar-task-2
```

**Notice** - Your task's **[id]** argument, can only contain alpha numeric characters, 
a-z, 0-9 - In addition to the following special characters; `.`, `-` and `_`.
When you create a task, you can also optionally schedule it simultaneously, by providing any amount of **[due]**
dates, and/or **[repeats]** patterns, which will create and schedule the task at the same time. Below is an example.

```
tasks.create:foo-bar-task-3
   due:date:"2025-01-01T23:59:27"
   repeats:5.seconds
   repeats:3.hours
   due:date:"2030-01-01T23:59:27"
   .lambda

      log.info:Executing foo-bar-task-2
```

The above schedules your task for being executed once in the year of 2025, another time in the year of 2030,
in addition to once every 3 hours and once every 5 seconds. This document will describe in details how schedules
works further down.

You can also _update_ an existing task by using the **[tasks.update]** slot. This slot allows you to update
a task's description and its Hyperlambda, but you _cannot_ associate schedules with your task using this
slot. If you've already created your task and you need to (re) schedule it, you'll need to combine the
slots **[tasks.schedule]** and **[tasks.schedule.delete]** together. Below is an example of first creating
a task for then to update it. Any existing schedules you've already associated with your task as you update
it will not be changed.

```
tasks.create:foo-bar-task-4
   .lambda

      log.info:Executing foo-bar-task-1

tasks.update:foo-bar-task-4
   description:This is the foo bar task
   .lambda

      log.info:Another log entry now!
```

## How to use [tasks.execute]

You can explicitly execute a persisted task by invoking **[tasks.execute]** and pass
in the ID of your task. Below is an example, that assumes you have created the above _"foo-bar-task-4"_ task
first.

```
tasks.execute:foo-bar-task-4
```

Notice, if you try to execute a non-existing task, an exception will be thrown.

## How to use [tasks.delete]

Use the **[tasks.delete]** signal to delete a task. This will also delete all future schedules for your task and
automatically dispose any timers associated with the task. An example can be found below.

```
tasks.delete:task-id
```

Besides from the task ID, the delete task signal doesn't take any arguments.

## How to use [tasks.get]

To inspect a task you can use the following.

```
tasks.get:task-id
```

The above will return the Hyperlambda for your task, in addition to your task's description. If you add
a **[schedules]** argument and set its value to boolean `true`, this slot will also return all schedules
associated with the task.

```
tasks.get:task-id
   schedules:true
```

## How to use [tasks.list]

To list tasks, you can use the **[tasks.list]** signal. This slot optionally
handles an **[offset]** and a **[limit]** argument, allowing you to page, which might be
useful if you have a lot of tasks in your system. If no **[limit]** is specified, this signal
will only return the first 10 tasks, including the task's Hyperlambda, but not its repetition
pattern(s), or due date(s). Below is an example.

```
tasks.list
   offset:20
   limit:10
```

## How Hyperlambda tasks are stored

All tasks are persisted into your `magic` database, either in MySQL, SQLite, PostgreSQL, or Microsoft SQL Server.
This implies that even if your server is stopped, all scheduled tasks and persisted tasks will automatically
load up again, and be available and re-scheduled as the server is restarted. This _might_ imply that
all tasks in the past are immediately executed, which is important for you to understand, since any tasks
with a due date in the past, are executed immediately as the server restarts again.
Tasks are by default persisted into your `tasks` table, and schedules are persisted into your
`task_due` table.

## How to use Hyperlambda tasks as business process workflows

Hyperlambda tasks allows you to persist a _"function invocation"_ for later to execute it, once some specific condition
occurs - Effectively giving you the most important features from Microsoft Workflow Foundation, without the
ridiculous XML and WYSIWYG features - In addition to that this also is a .Net Core library, contrary
to MWF that only works for the full .Net Framework. The Hyperlambda task scheduler is also probably at
least somewhere between 200 and 400 times faster than MWF, due to not using reflection during execution.

## How to use [tasks.schedule]

If you want to create a _scheduled_ task, you can choose to have the task executed once in the future, at a specified
date and time, by invoking **[tasks.schedule]**, and reference your task after it's been created, passing in
a **[due]** argument being a date and time in the future for when you want to execute your task.

```
tasks.create:foo-bar-task-3
   .lambda
      log.info:Executing foo-bar-task-3

tasks.schedule:foo-bar-task-3
   due:date:"2025-12-24T17:00"
```

The above **[due]** argument is a UTC date and time in the future for when you want your task to be scheduled
for execution. After the task has been executed, it will never execute again, unless you manually execute it,
or invoke **[tasks.schedule]** again.

**Notice** - You _cannot_ create a task with a due date being in the past, and all dates are assumed to be in
the UTC timezone. The unique ID of the schedule created is returned when you explicitly schedule a task using
the **[tasks.schedule]** slot. If you add schedules during invocations to **[tasks.create]** though, no schedule
IDs are returned, but you can still retrieve all schedules by invoking **[tasks.get]** and passing in **[schedules]**
to have the slot return all schedules for a specific task.

### How to repeatedly execute a task

There are 3 basic **[repeats]** patterns for the Magic Lambda Scheduler, in addition to that you can extend
it with your own parametrized repeating `IRepetitionPattern` implementation. The built in repetition patterns,
are as follows.

* `x.units` - Units can be one of _"seconds"_, _"minutes"_, _"hours"_, _"days"_, _"weeks"_ or _"months"_ - And
`x` can be any integer value.
* `MM.dd.HH.mm.ss` - Where the entities are in sequence months, days in months, hours, minutes and seconds.
* `ww.HH.mm.ss` - Where the entities are weekdays, hour, minute and second.

Notice, MM, dd, and ww can have double asterisk (\*\*) as their values, implying _"whatever value"_.
MM, dd and ww can also have multiple values, separated by the pipe character (|), to provide multiple values
for these types. See examples of this further below in this documentation.

### Evaluating a task periodically

Evaluating your task every second/minute/hour/etc can be done by using something such as the following.

```
tasks.create:task-id-qwqw
   .lambda

      log.info:Executing repeating task

tasks.schedule:task-id-qwqw
   repeats:50.seconds
```

The above will evaluate your task every 50 second. The above _"seconds"_ can be exchanged with _"minutes"_, _"hours"_, _"days"_, _"weeks"_ or _"months"_. Notice, this allows you to have very large values, to have tasks that are
repeating _very rarely_, such as the following illustrates.

```
tasks.create:task-id-qwerty123
   .lambda

      log.info:Executing seldomly repeating task once every 10 year

tasks.schedule:task-id-qwerty123
   repeats:3650.days
```

The above task will only be evaluated every 3650 days, which becomes once every 10 years. Below is a list of
all valid units types.

* seconds
* minutes
* hours
* days
* weeks
* months

### Periodically scheduled tasks

To create a task that is executed on the first day of _every_ month, at 5PM, you can use the following
repetition pattern.

```
tasks.create:task-id-xyx
   .lambda

      log.info:It is the 1st of the month, any month, and the time is 5AM at night.

tasks.schedule:task-id-xyx
   repeats:**.01.05.00.00
```

Hours must be supplied as _"military hours"_, implying from 00:00 to 23:59, where for instance 22 equals 10PM UTC time.
Also notice how we provided a double asterisk (\*\*) for the month parts, implying _"all months"_. We could also have provided
multiple days, and/or months, such as the following illustrates. The Hyperlambda below will create a task that is executed
in January and February, but only on the 5th and 15th of these months.

```
tasks.create:task-id
   .lambda

      log.info:It is the 5th or the 15th of January or February, and the time is 5AM at night.

tasks.schedule:task-id
   repeats:01|02.5|15.05.00.00
```

By using the double asterisk for month and day of month, you can create a task that is executed _every_ day, at
some specific time of the day (UTC time). Below is an example.

```
tasks.create:task-id-555
   .lambda

      log.info:It is the 10PM now.

tasks.schedule:task-id-555
   repeats:**.**.22.00.00
```

### Weekdays pattern and Hyperlambda tasks

If you use the weekdays pattern when you create your tasks, you can create any combinations of weekdays,
allowing you to supply multiple weekdays in a single repetition pattern. Below is an exhaustive list of
all possible weekdays.

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday
* Saturday
* Sunday

To evaluate a task every Saturday and Sunday for instance, you can use `saturday|sunday` as your weekday.
Below is an example. Notice, weekdays are case insensitive.

```
tasks.create:task-id-567
   .lambda

      log.info:It is Saturday or Sunday, and the time is 22PM.

tasks.schedule:task-id-567
   repeats:saturday|SUNDAY.22.00.00
```

You can also provide a double asterisk (\*\*) for the weekdays pattern, implying _"all days of the week"_.
Notice how weekdays are case-insensitive as illustrated above.

### Creating your own task repetition pattern

In addition to the internally provided repetition patternsfor tasks, you can also create your own repetition pattern type,
by implementing the `IRepetitionPattern` interface on one of your own types, and registering your type create function
by using the `PatternFactory.AddExtensionPattern` method. If you do, you'll have to reference your repetition
pattern type using _"ext:"_, combined with its resolver key. Implying if you register your `IRepetitionPattern` type such
that it resolves using for instance _"my-pattern"_ as its key, you'll have to use _"ext:my-pattern:args"
to reference it later, as you wish to create an instance of your custom pattern type. The _"args"_ part
are any arguments supplied to your pattern during creation. Below is an example that creates a custom
repetition pattern.

```
private class ExtPattern : IRepetitionPattern
{
    readonly string _args;
    public string Value => "ext:custom-pattern:" + _args;

    public ExtPattern(string args)
    {
        _args = args;
    }

    public DateTime Next()
    {
        return new DateTime(2030, 11, 11, 11, 11, 57);
    }
}
```

The above `IRepetitionPattern` will statically resolve to the 11th of November 2030, at 23:11:57. But
the idea is that the `args` supplied during creation, can be used to parametrize your pattern, and
calculate the next due date for your schedule.
After you have declared your custom `IRepetitionPattern` type, you'll need to inform the `PatternFactory` class
that you want to use the above class, and resolve it using some specific key from your schedules.
This is accomplished using something resembling the following code.

```
PatternFactory.AddExtensionPattern(
    "custom-type",
    str =>
    {
        return new ExtPattern(str);
    });
```

The above code will ensure that every time you use _"custom-type"_ as a repetition pattern type,
the create function above will be invoked, allowing you to create and decorate an instance of your
custom `IRepetitionPattern` type. The `str` argument to your above create function, will be everything
after the `ext:custom-type:` parts, when creating an instance of your pattern.
To use the above pattern in your own code, you can use something such as the following.

```
tasks.create:custom-repetition-pattern
   .lambda

      log.info:Executing custom-repetition-pattern

tasks.schedule:custom-repetition-pattern
   repeats:"ext:custom-pattern:some-arguments-here"
```

In the above **[repeat]** argument, the `ext` parts informs the scheduler that you want to use a
custom repetition pattern, the `custom-pattern` parts resolves to your `IRepetitionPattern` create function,
and the _"some-arguments-here"_ parts will be passed into your above `ExtPattern` constructor allowing
you to parametrize your pattern any ways you see fit.

### Task scheduler internals

One `System.Threading.Timer` object will be created for each due date/repetition pattern you have, and kept
in memory of your Magic server, which doesn't lend itself to thousands of schedules for obvious reasons - But
due to the mechanics of how these are implemented at the system level, this is still highly scalable for most
solutions.

When a repeating task has finished executed, the next due date for the task's execution will be calculated using
its interval pattern - Implying that if you use a 5 second pattern, the schedule for its next execution, will be
calculated 5 seconds from the time the task _finished_ executing, which might not necessarily imply that your tasks
are executed exactly every 5 seconds, depending upon how much time your task requires to execute. The interval
pattern declares how many units to count to before executing the task again, from when the task _finished_ executing.

