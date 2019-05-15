
# Magic Tests

This project provides a couple of _"intelligent"_ base classes and utility classes for your convenience, allowing
you to more easily create unit tests. For instance, the DbConnection class, allows you to create an nHibernate in-memory
SQLite throw away database for every test you invoke, allowing you to easily unit test for instance controllers requiring
a database, without having to rely upon the state of some external database.

You can check out the code for _"magic.todo.tests"_ to see an example of usage. Below is one of these tests to illustrate
usage.

```csharp
[Fact]
public void SaveGet()
{
    using (var connection = new DbConnection((svc) =>
    {
        // Inject your own dependencies here into the specified IServiceCollection

    }, typeof(Todo).Assembly)) // Registers which assemblies contains your nHibernate mapping classes
    {

		// Create your controller here ...
        var controller = CreateController(connection);

		// Run your unit tests, and create a couple of Asserts below ...
        var saveResult = controller.Save(new www.Todo
        {
            Header = "Some header",
            Description = "Some description",
            Done = false
        });

        var loadResult = controller.Get(saveResult);

        Assert.Equal("Some header", loadResult.Header);
        Assert.Equal("Some description", loadResult.Description);
        Assert.False(loadResult.Done);
        Assert.Equal(loadResult.Id, saveResult);
    }
}
```

The `DbConnection` class above automatically takes care of creating a _"throw-away"_ SQLite database connection for
every single unit test it runs, allowing you to easily unit test your database code, without relying upon an external
(and often slow) database connection.

