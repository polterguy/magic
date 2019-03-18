/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Reflection;
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
        readonly Func<WebModel> _createModel;
        readonly Action<WebModel> _assert;

        public CrudTest(Func<Connection, Controller> createController, Func<WebModel> createModel, Action<WebModel> assert)
        {
            _createController = createController ?? throw new ArgumentNullException(nameof(createController));
            _createModel = createModel ?? throw new ArgumentNullException(nameof(createModel));
            _assert = assert ?? throw new ArgumentNullException(nameof(assert));
        }

        [Fact]
        public void Create()
        {
            using (var connection = new Connection(GetAssemblies()))
            {
                var controller = _createController(connection);
                var createResult = Single(controller.Create(_createModel()));
                Assert.True(createResult.Id.HasValue);
                Assert.False(createResult.Id.Equals(Guid.Empty));
                var afterCreate = Single(controller.Get(createResult.Id.Value));
                _assert(afterCreate);
            }
        }

        [Fact]
        public void Read()
        {

        }
        [Fact]
        public void Update()
        {

        }
        [Fact]
        public void Delete()
        {

        }

        #region [ -- Private helper methods -- ]

        T Single<T>(ActionResult<T> input) where T : class
        {
            Assert.IsType<OkObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((OkObjectResult)input.Result).Value);
        }

        T SingleFault<T>(ActionResult<T> input) where T : class
        {
            Assert.IsType<BadRequestObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((BadRequestObjectResult)input.Result).Value);
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
