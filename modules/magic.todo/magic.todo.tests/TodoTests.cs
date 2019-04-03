/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Xunit;
using Ninject;
using FluentNHibernate.Testing;
using magic.tests;
using magic.todo.model;
using magic.todo.services;
using magic.todo.contracts;
using magic.email.web.controller;
using www = magic.todo.web.model;

namespace magic.todo.tests
{
    public class TodoTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public void VerifyTheMappings()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                new PersistenceSpecification<Todo>(connection.Session)
                    .CheckProperty(c => c.Header, "Header")
                    .CheckProperty(c => c.Description, "Description")
                    .CheckProperty(c => c.Done, false)
                    .VerifyTheMappings();
            }
        }

        [Fact]
        public void SaveGet()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Header = "Some header",
                    Description = "Some description",
                    Done = false
                }));
                Assert.True(saveResult.Id.HasValue);

                var loadResult = AssertHelper.Single(controller.Get(saveResult.Id.Value));
                Assert.Equal("Some header", loadResult.Header);
                Assert.Equal("Some description", loadResult.Description);
                Assert.False(loadResult.Done);
                Assert.Equal(loadResult.Id, saveResult.Id);
            }
        }

        #endregion

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
