/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ExceptionsTests
    {
        [Fact]
        public void Throws_01()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
try
   throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public void Throws_02_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
try
   throw:foo
"));
        }

        [Fact]
        public void Throws_03()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
.field
try
   throw:foo
      field:foo
.catch
   set-value:x:@.throws
      .:bool:true
   set-value:x:@.field
      get-value:x:@.arguments/*/field
");
            Assert.Equal(true, lambda.Children.First().Value);
            Assert.Equal("foo", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void NoThrow_01()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
try
   .throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
");
            Assert.Equal(false, lambda.Children.First().Value);
        }


        [Fact]
        public async Task Throws_02_ThrowsAsync()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
try
   throw:foo
"));
        }

        [Fact]
        public async Task NoThrow_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.throws:bool:false
try
   .throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
");
            Assert.Equal(false, lambda.Children.First().Value);
        }

        [Fact]
        public void Throws_02()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
try
   throw:foo
.catch
.finally
   set-value:x:@.throws
      .:bool:true
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public void Throws_FinallyInvoked()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
try
   try
      throw:foo
   .finally
      set-value:x:@.throws
         .:bool:true
.catch
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public async Task Throws_FinallyInvokedAsync_01()
        {
            var lambda = await Common.EvaluateAsync(@"
.throws:bool:false
try
   try
      throw:foo
   .finally
      set-value:x:@.throws
         .:bool:true
.catch
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public async Task Throws_FinallyInvokedAsync_02()
        {
            var lambda = await Common.EvaluateAsync(@"
.throws:bool:false
try
   try
      throw:foo
   .catch
   .finally
      set-value:x:@.throws
         .:bool:true
.catch
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public void Throws_03Throws()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
.status
.public
.message
.type
try
   throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
   set-value:x:@.status
      get-value:x:@.arguments/*/status
   set-value:x:@.public
      get-value:x:@.arguments/*/public
   set-value:x:@.message
      get-value:x:@.arguments/*/message
   set-value:x:@.type
      get-value:x:@.arguments/*/type
");
            Assert.Equal(500, lambda.Children.Skip(1).First().Value);
            Assert.Equal(false, lambda.Children.Skip(2).First().Value);
            Assert.Equal("foo", lambda.Children.Skip(3).First().Value);
            Assert.Equal("magic.node.extensions.HyperlambdaException", lambda.Children.Skip(4).First().Value);
        }

        [Fact]
        public async Task Throws_03ThrowsAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.throws:bool:false
.status
.public
.message
.type
try
   throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
   set-value:x:@.status
      get-value:x:@.arguments/*/status
   set-value:x:@.public
      get-value:x:@.arguments/*/public
   set-value:x:@.message
      get-value:x:@.arguments/*/message
   set-value:x:@.type
      get-value:x:@.arguments/*/type
");
            Assert.Equal(500, lambda.Children.Skip(1).First().Value);
            Assert.Equal(false, lambda.Children.Skip(2).First().Value);
            Assert.Equal("foo", lambda.Children.Skip(3).First().Value);
            Assert.Equal("magic.node.extensions.HyperlambdaException", lambda.Children.Skip(4).First().Value);
        }

        [Fact]
        public void Throws_04()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
try
   throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public void Throws_05()
        {
            var lambda = Common.Evaluate(@"
.throws:bool:false
.status
.public
.message
.type
try
   throw
      public:true
      status:123
.catch
   set-value:x:@.throws
      .:bool:true
   set-value:x:@.status
      get-value:x:@.arguments/*/status
   set-value:x:@.public
      get-value:x:@.arguments/*/public
   set-value:x:@.message
      get-value:x:@.arguments/*/message
   set-value:x:@.type
      get-value:x:@.arguments/*/type
");
            Assert.Equal(123, lambda.Children.Skip(1).First().Value);
            Assert.Equal(true, lambda.Children.Skip(2).First().Value);
            Assert.Equal("[no-message]", lambda.Children.Skip(3).First().Value);
            Assert.Equal("magic.node.extensions.HyperlambdaException", lambda.Children.Skip(4).First().Value);
        }

        [Fact]
        public async Task Throws_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.throws:bool:false
try
   throw:foo
.catch
   set-value:x:@.throws
      .:bool:true
");
            Assert.True(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public void ThrowsCSharp_01()
        {
            HyperlambdaException ex = null;
            try
            {
                throw new HyperlambdaException();
            }
            catch(HyperlambdaException ex2)
            {
                ex = ex2;
            }
            Assert.Equal(500, ex.Status);
            Assert.False(ex.IsPublic);
        }

        [Fact]
        public void ThrowsCSharp_02()
        {
            HyperlambdaException ex = null;
            try
            {
                throw new HyperlambdaException("foo");
            }
            catch(HyperlambdaException ex2)
            {
                ex = ex2;
            }
            Assert.Equal(500, ex.Status);
            Assert.False(ex.IsPublic);
            Assert.Equal("foo", ex.Message);
        }

        [Fact]
        public void ThrowsCSharp_03()
        {
            HyperlambdaException ex = null;
            try
            {
                throw new HyperlambdaException("foo", new HyperlambdaException());
            }
            catch(HyperlambdaException ex2)
            {
                ex = ex2;
            }
            Assert.Equal(500, ex.Status);
            Assert.False(ex.IsPublic);
            Assert.Equal("foo", ex.Message);
            Assert.Equal(typeof(HyperlambdaException), ex.InnerException.GetType());
        }
    }
}
