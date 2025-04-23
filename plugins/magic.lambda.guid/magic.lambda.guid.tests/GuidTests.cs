/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;

namespace magic.lambda.guid.tests
{
    public class GuidTests
    {
        [Fact]
        public void Create()
        {
            var lambda = Common.Evaluate(@"guid.new");
            Assert.Equal(typeof(Guid), lambda.Children.First().Value.GetType());
        }
    }
}
