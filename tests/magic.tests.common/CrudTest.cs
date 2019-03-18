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
        where WebModel : class, new()
    {
        readonly Func<Connection, Controller> _createController;
        readonly Func<int, WebModel> _createModel;
        readonly Action<int, WebModel> _assert;
        readonly Action<WebModel> _assertAfterModified;
        readonly Action<WebModel> _modifyModel;

        public CrudTest(
            Func<Connection, Controller> createController, 
            Func<int, WebModel> createModel,
            Action<int, WebModel> assert,
            Action<WebModel> assertAfterModified,
            Action<WebModel> modifyModel)
        {
            _createController = createController ?? throw new ArgumentNullException(nameof(createController));
            _createModel = createModel ?? throw new ArgumentNullException(nameof(createModel));
            _assert = assert ?? throw new ArgumentNullException(nameof(assert));
            _modifyModel = modifyModel ?? throw new ArgumentNullException(nameof(modifyModel));
            _assertAfterModified = assertAfterModified ?? throw new ArgumentNullException(nameof(assertAfterModified));
        }

        [Fact]
        public void Create()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult = Single(controller.Create(_createModel(0)));
                Assert.True(createResult.Id.HasValue);
                Assert.False(createResult.Id.Equals(Guid.Empty));
                var afterCreate = Single(controller.Get(createResult.Id.Value));
                _assert(0, afterCreate);
            }
        }

        [Fact]
        public void Read()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult_01 = Single(controller.Create(_createModel(0)));
                var createResult_02 = Single(controller.Create(_createModel(1)));
                var afterCreate = List(controller.List());
                _assert(0, afterCreate.First());
                _assert(1, afterCreate.Last());
            }
        }

        [Fact]
        public void Update()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult = Single(controller.Create(_createModel(0)));
                var afterCreate = Single(controller.Get(createResult.Id.Value));
                _modifyModel(afterCreate);
                _assertAfterModified(afterCreate);
            }
        }

        [Fact]
        public void Delete()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult_01 = Single(controller.Create(_createModel(0)));
                var createResult_02 = Single(controller.Create(_createModel(1)));
                var afterCreate = List(controller.List());
                controller.Delete(createResult_01.Id.Value);
                var count = Single(controller.Count());
                Assert.Equal(1, count);
            }
        }

        [Fact]
        public void Count()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult_01 = Single(controller.Create(_createModel(0)));
                var createResult_02 = Single(controller.Create(_createModel(1)));
                var count = Single(controller.Count());
                Assert.Equal(2, count);
            }
        }

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

        Assembly[] GetAssemblies()
        {
            var type = typeof(IMappingProvider);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                .Where(asm => asm.GetTypes().Any(x => type.IsAssignableFrom(x) && !x.IsInterface && !x.FullName.StartsWith("FluentNHibernate")));
            return assemblies.ToArray();
        }

        #endregion
    }
}
