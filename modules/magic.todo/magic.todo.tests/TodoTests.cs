/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;
using Ninject;
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

        [Fact]
        public void SaveFail_01()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                Assert.Throws<PropertyValueException>(() =>
                {
                    AssertHelper.Single(controller.Save(new www.Todo
                    {
                        Description = "Some description",
                        Done = false
                    }));
                });
            }
        }

        [Fact]
        public void SaveFail_02()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                Assert.Throws<PropertyValueException>(() =>
                {
                    AssertHelper.Single(controller.Save(new www.Todo
                    {
                        Header = "Some description",
                        Done = true
                    }));
                });
            }
        }

        [Fact]
        public void SaveList()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult1 = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Header = "Some header xx",
                    Description = "Some description xx",
                    Done = true
                }));

                var saveResult2 = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Header = "Some header xx2",
                    Description = "Some description xx2",
                    Done = false
                }));

                var loadResult = AssertHelper.List(controller.List());
                Assert.Equal(2, loadResult.Count());

                Assert.Equal("Some header xx", loadResult.First().Header);
                Assert.Equal("Some description xx", loadResult.First().Description);
                Assert.True(loadResult.First().Done);
                Assert.Equal(loadResult.First().Id, saveResult1.Id);

                Assert.Equal("Some header xx2", loadResult.Last().Header);
                Assert.Equal("Some description xx2", loadResult.Last().Description);
                Assert.False(loadResult.Last().Done);
                Assert.Equal(loadResult.Last().Id, saveResult2.Id);
            }
        }

        [Fact]
        public void SaveDeleteList()
        {
            using (var connection = new DbConnection(typeof(Todo).Assembly))
            {
                var controller = CreateController(connection);

                var saveResult1 = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Header = "Some header xx",
                    Description = "Some description xx",
                    Done = true
                }));

                var saveResult2 = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Header = "Some header xx2",
                    Description = "Some description xx2",
                    Done = false
                }));

                AssertHelper.Single(controller.Delete(saveResult1.Id.Value));

                var loadResult = AssertHelper.List(controller.List());
                Assert.Single(loadResult);

                Assert.Equal("Some header xx2", loadResult.First().Header);
                Assert.Equal("Some description xx2", loadResult.First().Description);
                Assert.False(loadResult.First().Done);
                Assert.Equal(loadResult.First().Id, saveResult2.Id);
            }
        }

        [Fact]
        public void SaveUpdateGet()
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

                var updateResult = AssertHelper.Single(controller.Save(new www.Todo
                {
                    Id = saveResult.Id.Value,
                    Header = "Some other header",
                    Description = "Some other description",
                    Done = true,
                }));

                var loadResult = AssertHelper.Single(controller.Get(updateResult.Id.Value));
                Assert.Equal("Some other header", loadResult.Header);
                Assert.Equal("Some other description", loadResult.Description);
                Assert.True(loadResult.Done);
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
