
# Magic common

This is the CRUD API helper module, that allows you to rapidly create CRUD APIs, arguably without having to create more than
a single line of C# code. It features some intelligent generic constructs, and relies upon you inheriting your API controllers
and services from these generic classes.

Notice, not all database tables, and/or operations, lends themselves to this approach. However, for those that do, inheriting
from the base classes found in this module, seriously reduces your efforts when creating API endpoints wrapping your database
for CRUD operations, and results in what I refer to as _"Super DRY code"_ - DRY again implying _"Don't Repeat Yourself"_.

Below is some example code illustrating usage.

**Controller**

```csharp
[Route("api/todo")]
public class TodoController : CrudController<www.Todo, db.Todo>
{
    public TodoController(ITodoService service)
        : base(service)
    { }
}
```

**Service implementation**

```csharp
public class TodoService : CrudService<Todo>, ITodoService
{
    public TodoService(ISession session)
        : base(session)
    { }
}
```

**Service contract/interface**

```csharp
public interface ITodoService : ICrudService<Todo>
{ }
```

**Model**

```csharp
public class Todo : Model
{
    public virtual string Header { get; set; }
    public virtual string Description { get; set; }
    public virtual bool Done { get; set; }
}
```

**Database mapping class**

```csharp
public class TodoMap : ClassMap<Todo>
{
    public TodoMap()
    {
        Table("todos");
        Id(x => x.Id);
        Map(x => x.Header).Not.Nullable().Length(256);
        Map(x => x.Description).Not.Nullable().Length(4096);
        Map(x => x.Done).Not.Nullable();
    }
}
```

**View model/DTO**

```csharp
public class Todo
{
    public Guid? Id { get; set; }
    public string Header { get; set; }
    public string Description { get; set; }
    public bool Done { get; set; }
}
```

**Initializing logic**

```csharp
public class Initializer : IInitialize
{
    public void Initialize(IServiceCollection services)
    {
        services.AddTransient<ITodoService, TodoService>();
    }
}
```

See the _"/modules/magic.todo/"_ folder for more details about how to create your own modules using _"magic.common"_.


