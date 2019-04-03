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
        public void Create()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);
                var output = controller.Save(new www.Todo
                {
                    Header = "Some header",
                    Description = "Some description",
                    Done = false
                });
                var result = AssertHelper.Single(output);
                Assert.True(result.Id.HasValue);
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
