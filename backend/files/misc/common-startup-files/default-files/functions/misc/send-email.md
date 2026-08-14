# Function; Send email
FUNCTION ==> send-email

The following function can be used to send an email.

```plaintext
___
FUNCTION_INVOCATION[/misc/workflows/workflows/misc/send-email.hl]:
{
  "from": "[STRING_VALUE]",
  "from-name": "[STRING_VALUE]",
  "to": "[STRING_VALUE]",
  "to-name": "[STRING_VALUE]",
  "subject": "[STRING_VALUE]",
  "body": "[STRING_VALUE]"
}
___
```

Arguments:

* `from` is mandatory and the sender's email address. Unless the user explicitly says something else, then use the user's email address.
* `from-name` is mandatory and the sender's full name. Unless the user explicitly says something else, then use the user's name.
* `to` is mandatory and the receiver's email address.
* `to-name` is mandatory and the receiver's full name.
* `subject` is mandatory and the subject of the email.
* `body` is mandatory and the body of the email. This can be markdown, at which point it will be automatically converted into HTML. It can also be HTML.

The above `from` and `to` are assumed to be valid emails, and an exception will be thrown if not.
