/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace magic.tests
{
    public class AssertHelper
    {
        public static T Single<T>(ActionResult<T> input)
        {
            Assert.IsType<OkObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((OkObjectResult)input.Result).Value);
        }

        public static T Fault<T>(ActionResult<T> input)
        {
            Assert.IsType<BadRequestObjectResult>(input.Result);
            return Assert.IsAssignableFrom<T>(((BadRequestObjectResult)input.Result).Value);
        }

        public static IEnumerable<T> List<T>(ActionResult<IEnumerable<T>> input)
        {
            Assert.IsType<OkObjectResult>(input.Result);
            return Assert.IsAssignableFrom<IEnumerable<T>>(((OkObjectResult)input.Result).Value);
        }
    }
}