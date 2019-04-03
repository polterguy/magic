/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Xunit;
using Ninject;
using magic.tests;
using magic.todo.model;
using magic.todo.services;
using magic.todo.contracts;
using magic.email.web.controller;
using www = magic.todo.web.model;
using System;

namespace magic.todo.tests
{
    public class TodoTests
    {
        [Fact]
        public void CreateRead()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);
                var saveOutput = controller.Save(new www.Todo
                {
                    Header = "Some header",
                    Description = "Some description",
                    Done = false
                });
                var saveResult = AssertHelper.Single(saveOutput);
                Assert.True(saveResult.Id.HasValue);

                var loadOutput = controller.Get(saveResult.Id.Value);
                var loadResult = AssertHelper.Single(loadOutput);
                Assert.Equal("Some header", loadResult.Header);
                Assert.Equal("Some description", loadResult.Description);
                Assert.False(loadResult.Done);
                Assert.Equal(loadResult.Id, saveResult.Id);
            }
        }

        #region [ -- Private helper methods -- ]

        TodosController CreateController(DbConnection connection)
        {
            connection.Kernel.Bind<ITodoService>().To<TodoService>();
            connection.Kernel.Bind<TodosController>().ToSelf();
            return connection.Kernel.Get<TodosController>();
        }

        #endregion
    }
}
