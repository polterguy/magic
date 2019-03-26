/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using FluentNHibernate;
using magic.web.controller.common;
using magic.tests.common.utilities;

namespace magic.tests.common
{
    public abstract class CrudTest<Controller, WebModel, DbModel> 
        where Controller : CrudController<WebModel, DbModel>
    {
        #region [ -- Generic unit tests -- ]

        [Fact]
        public virtual void Create()
        {
            using (var connection = new Connection(GetAssemblies().ToArray()))
            {
                var controller = CreateController(connection);
                var createResult = Single(controller.Create(CreateModel(0)));
                Assert.True(createResult.Id.HasValue);
                Assert.False(createResult.Id.Equals(Guid.Empty));
                var afterCreate = Single(controller.Get(createResult.Id.Value));
                AssertModel(0, afterCreate);
            }
        }

        [Fact]
        public virtual void Read()
        {
            using (var connection = new Connection(GetAssemblies().ToArray()))
            {
                var controller = CreateController(connection);
                var createResult_01 = Single(controller.Create(CreateModel(0)));
                var createResult_02 = Single(controller.Create(CreateModel(1)));
                var afterCreate = List(controller.List());
                AssertModel(0, afterCreate.First());
                AssertModel(1, afterCreate.Last());
            }
        }

        [Fact]
        public virtual void Update()
        {
            using (var connection = new Connection(GetAssemblies().ToArray()))
            {
                var controller = CreateController(connection);
                var createResult = Single(controller.Create(CreateModel(0)));
                var afterCreate = Single(controller.Get(createResult.Id.Value));
                ModifyModel(afterCreate);
                controller.Update(afterCreate);
                var afterUpdate = Single(controller.Get(createResult.Id.Value));
                AssertModelAfterModified(afterUpdate);
            }
        }

        [Fact]
        public virtual void Delete()
        {
            using (var connection = new Connection(GetAssemblies().ToArray()))
            {
                var controller = CreateController(connection);
                var createResult_01 = Single(controller.Create(CreateModel(0)));
                var createResult_02 = Single(controller.Create(CreateModel(1)));
                var afterCreate = List(controller.List());
                controller.Delete(createResult_01.Id.Value);
                var count = Single(controller.Count());
                Assert.Equal(1, count);
                var remaining = Single(controller.Get(createResult_02.Id.Value));
                AssertModel(1, remaining);
            }
        }

        [Fact]
        public virtual void Count()
        {
            using (var connection = new Connection(GetAssemblies().ToArray()))
            {
                var controller = CreateController(connection);
                var createResult_01 = Single(controller.Create(CreateModel(0)));
                var createResult_02 = Single(controller.Create(CreateModel(1)));
                var count = Single(controller.Count());
                Assert.Equal(2, count);
            }
        }

        #endregion

        #region [ -- Abstract methods -- ]

        abstract protected Controller CreateController(Connection connection);

        abstract protected WebModel CreateModel(int no);

        abstract protected void AssertModel(int no, WebModel model);

        abstract protected void ModifyModel(WebModel model);

        abstract protected void AssertModelAfterModified(WebModel todo);

        #endregion

        #region [ -- Private helper methods -- ]

        T Single<T>(ActionResult<T> input)
        {
            Assert.IsType<OkObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((OkObjectResult)input.Result).Value);
        }

        T SingleFault<T>(ActionResult<T> input)
        {
            Assert.IsType<BadRequestObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((BadRequestObjectResult)input.Result).Value);
        }

        IEnumerable<T> List<T>(ActionResult<IEnumerable<T>> input)
        {
            Assert.IsType<OkObjectResult>(input.Result);
            return Assert.IsAssignableFrom<IEnumerable<T>>(((OkObjectResult)input.Result).Value);
        }

        protected IEnumerable<Assembly> GetAssemblies()
        {
            var type = typeof(IMappingProvider);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                .Where(asm => asm.GetTypes()
                .Any(x => type.IsAssignableFrom(x) && !x.IsInterface && !x.FullName.StartsWith("FluentNHibernate")));
            return assemblies;
        }

        #endregion
    }
}
