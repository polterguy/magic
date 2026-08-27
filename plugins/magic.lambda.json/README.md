---
title: magic.lambda.json
---

This project provides JSON helper slots for Magic. More specifically, it provides the following slots.

* __[json2lambda]__ - Creates a lambda object out of a JSON input string.
* __[json2yaml]__ - Converts a JSON string to its YAML equivalent.
* __[yaml2lambda]__ - Creates a lambda object out of a YAML input string.
* __[yaml2json]__ - Creates a JSON string out of a YAML input string.
* __[lambda2json]__ - Creates JSON out of a lambda object.
* __[lambda2yaml]__ - Converts a lambda object to its YAML equivalent.

## How to use [json2lambda] and [lambda2json]

```
.json:@"{""property"": ""value""}"
json2lambda:x:-
lambda2json:x:-/*
```

The **[lambda2json]** slot can optionally take a **[format]** argument, with a boolean _"true"_ value, which implies the
resulting JSON will be indented and nicely formated, making it more readable.

**Notice** - Although all JSON can be transformed into lambda, the opposite is not necessarily true. This is because
lambda allows for having multiple nodes with the same name for instance, which would result in a JSON object with
multiple properties having the same key. Hence, have this in mind as you persist your lambda objects into JSON.

## How to use [yaml2lambda] and [lambda2yaml]

The **[yaml2lambda]** slot converts a YAML input string to a lambda object. Since YAML arguably is just another representation of
JSON, these slot have been added to this project. Notice, the same constraints applies for YAML as does for JSON, implying
a YAML string can always be converted to a lambda object, but the opposite is not necessary true. Basic usage is as follows.

```
.yaml:@"
foo: howdy
bar: jo
howdy: !!bool true
children:
- howdy
- some
"
yaml2lambda:x:@.yaml
lambda2yaml:x:-/*
```

The above will result in the following.

```
yaml2lambda
   foo:howdy
   bar:jo
   howdy:bool:true
   children
      .:howdy
      .:some
lambda2yaml: /* ... YAML content ... */
```

Internally the **[yaml2lambda]** slot first converts the input YAML to JSON, for then to use the **[json2lambda]**
logic, ensuring the exact same result, regardless of whether or not you start out with JSON or YAML.

## How to use [yaml2json] and [json2yaml]

The **[yaml2json]** slot converts the specified YAML input string to a JSON string. Basic usage is as follows.

```
.yaml:@"foo: howdy
bar: jo
howdy: !!bool true
children:
- howdy
- some
"
yaml2json:x:@.yaml
json2yaml:x:-
```

The above results in the following.

```
{
  "foo": "howdy",
  "bar": "jo",
  "howdy": true,
  "children": [
    "howdy", "some"
  ]
}
```

Notice, the above have been formatted for brevity. The actual JSON result will _not_ be formatted, or having indentation to ensure
result is as compact as possible.

