# Function; Schedule task
FUNCTION ==> schedule-task

The following function can be used to schedule a specific task. If the user wants to schedule a task for periodically repeating, or to be executed some time in the future, you can use this function.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/tasks/schedule-task.hl]:
{
  "name": "[STRING_VALUE]",
  "due": "[DATE_VALUE]",
  "repeats": "[REPETITION_STRING]"
}
___
```

Arguments:

* `name` is mandatory name or id of the task to schedule
* `due` is optional and is an exact date in the future when the task should execute once. This has to be an ISO date in UTC time zone.
* `repeats` is optional and is a repetition pattern explaining when the task should execute. See below description for how to create this argument.

## About repetition pattern

The repetition pattern for scheduling a task can be populated in 3 different ways:

- `n.unit` where `n` is a number and `unit` is a unit. The unit can be "seconds", "minutes", "hours", or "days".
- `ww.HH.mm.ss` where `ww` is weekday(s), `HH` is military hours UTC time, `mm` is minutes and `ss` is seconds. You can supply multiple weekdays by separating each weekday with a `|` character, such as for instance "Friday|Sunday.04.30.00" implying Fridays and Sundays at 04:30 UTC time.
- `MM.dd.HH.mm.ss` where `MM` and `dd` can have multiple values separated by a `|` character.

**IMPORTANT** - Never use colon (:) to separate parts of the repetition pattern, always use periods (.).

Notice, this function requires the task to previously having been created using the `create-task` function. If the user wants to schedule a task in the future, you have to first make sure that the task is created using the `create-task` function.
