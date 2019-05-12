/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using NHibernate;
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
            using (var connection = new DbConnection(null, typeof(Todo).Assembly))
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
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

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

        [Fact]
        public void SaveFail_01()
        {
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                Assert.Throws<PropertyValueException>(() =>
                {
                    controller.Save(new www.Todo
                    {
                        Description = "Some description",
                        Done = false
                    });
                });
            }
        }

        [Fact]
        public void SaveFail_02()
        {
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                Assert.Throws<PropertyValueException>(() =>
                {
                    controller.Save(new www.Todo
                    {
                        Header = "Some description",
                        Done = true
                    });
                });
            }
        }

        [Fact]
        public void SaveList()
        {
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult1 = controller.Save(new www.Todo
                {
                    Header = "Some header xx",
                    Description = "Some description xx",
                    Done = true
                });

                var saveResult2 = controller.Save(new www.Todo
                {
                    Header = "Some header xx2",
                    Description = "Some description xx2",
                    Done = false
                });

                var loadResult = controller.List();
                Assert.Equal(2, loadResult.Count());

                Assert.Equal("Some header xx", loadResult.First().Header);
                Assert.Equal("Some description xx", loadResult.First().Description);
                Assert.True(loadResult.First().Done);
                Assert.Equal(loadResult.First().Id, saveResult1);

                Assert.Equal("Some header xx2", loadResult.Last().Header);
                Assert.Equal("Some description xx2", loadResult.Last().Description);
                Assert.False(loadResult.Last().Done);
                Assert.Equal(loadResult.Last().Id, saveResult2);
            }
        }

        [Fact]
        public void SaveDeleteList()
        {
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult1 = controller.Save(new www.Todo
                {
                    Header = "Some header xx",
                    Description = "Some description xx",
                    Done = true
                });

                var saveResult2 = controller.Save(new www.Todo
                {
                    Header = "Some header xx2",
                    Description = "Some description xx2",
                    Done = false
                });

                controller.Delete(saveResult1);

                var loadResult = controller.List();
                Assert.Single(loadResult);

                Assert.Equal("Some header xx2", loadResult.First().Header);
                Assert.Equal("Some description xx2", loadResult.First().Description);
                Assert.False(loadResult.First().Done);
                Assert.Equal(loadResult.First().Id, saveResult2);
            }
        }

        [Fact]
        public void SaveUpdateGet()
        {
            using (var connection = new DbConnection((svc) =>
            {
                InjectDependencies(svc);
            }, typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult = controller.Save(new www.Todo
                {
                    Header = "Some header",
                    Description = "Some description",
                    Done = false
                });

                var updateResult = controller.Save(new www.Todo
                {
                    Id = saveResult,
                    Header = "Some other header",
                    Description = "Some other description",
                    Done = true,
                });

                var loadResult = controller.Get(updateResult);
                Assert.Equal("Some other header", loadResult.Header);
                Assert.Equal("Some other description", loadResult.Description);
                Assert.True(loadResult.Done);
                Assert.Equal(loadResult.Id, saveResult);
            }
        }

        #endregion

        #region [ -- Private helper methods -- ]

        TodosController CreateController(DbConnection connection)
        {
            return connection.Provider.GetService(typeof(TodosController)) as TodosController;
        }

        void InjectDependencies(ServiceCollection services)
        {
            services.AddTransient<ITodoService, TodoService>();
            services.AddTransient<TodosController>();
        }

        #endregion
    }
}
