
# Magic HTTP

This module gives you an _"intelligent"_ HTTP REST client, that allows you to invoke other HTTP REST endpoints with a single
line of code. It features intelligent usage of generics arguments, that combined with Newtonsoft JSON, allows you to
generically pass in the _"input"_ type and _"output"_ type, making it possible to invoke HTTP methods, async, as if
they were simple method/function invocations.

Example usage


```csharp

using magic.http.services;

// Your request payload type
class RequestDTO
{
    public string Foo { get; set; }
}

// Your response payload type
class ResponseDTO
{
    public string Bar { get; set; }
}

// Your request DTO instance
var input = new RequestDTO
{
    Foo = "some string"
};

/*
 * Client is an instance of an IHttpClient, and can be retrieved using dependency injection.
 * Alternatively, by uncommenting the line below.
 */

// IHttpClient client = new HttpClient();

var result = await client.PostAsync<RequestDTO, ResponseDTO>("https://somewhere.com/api", input);

// "result" is now of type "ResponseDTO".
```

Notice, this class can just as easily be consumed from for instance a console application, as from a web app, at which point
you'll simply need to reference the project(s) from your console app, or whatever type of app you happen to be creating.


