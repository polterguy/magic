/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Mapster;
using magic.tests.common;
using magic.services.todo;
using magic.web.controller.email;
using magic.tests.common.utilities;
using db = magic.model.todo;
using www = magic.web.model.todo;
using Xunit;

namespace magic.tests.todo
{
    public class TodoTests : CrudTest<TodoController, www.Todo, db.Todo>
    {
        public TodoTests() : base(CreateController, CreateModel, AssertModel)
        { }

        #region [ -- Private helper methods -- ]

        static TodoController CreateController(Connection connection)
        {
            return new TodoController(new Adapter(), new TodoService(connection.Session));
        }

        static www.Todo CreateModel()
        {
            return new www.Todo
            {
                Header = "Some header",
                Description = "Some description",
                Done = false
            };
        }

        static void AssertModel(www.Todo todo)
        {
            Assert.Equal("Some header", todo.Header);
            Assert.Equal("Some description", todo.Description);
            Assert.False(todo.Done);
        }

        #endregion
    }
}
