/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.validators.tests
{
    public class ValidatorTests
    {
        [Fact]
        public void VerifyEmail()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo@bar.com");
            signaler.Signal("validators.email", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyEmail_FAILS()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo@@bar.com");
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.email", args));
        }

        [Fact]
        public void VerifyInteger()
        {
            var signaler = Common.Initialize();
            var args = new Node("", 5, new Node[] { new Node("min", 4), new Node("max", 7) });
            signaler.Signal("validators.integer", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyInteger_FAILS_01()
        {
            var signaler = Common.Initialize();
            var args = new Node("", 8, new Node[] { new Node("min", 4), new Node("max", 7) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.integer", args));
        }

        [Fact]
        public void VerifyInteger_FAILS_02()
        {
            var signaler = Common.Initialize();
            var args = new Node("", 3, new Node[] { new Node("min", 4), new Node("max", 7) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.integer", args));
        }

        [Fact]
        public void VerifyString_01()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "howdy", new Node[] { new Node("min", 4), new Node("max", 7) });
            signaler.Signal("validators.string", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyString_02()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "howdy");
            signaler.Signal("validators.string", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyString_FAILS_01()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "how", new Node[] { new Node("min", 4), new Node("max", 7) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.string", args));
        }

        [Fact]
        public void VerifyString_FAILS_02()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "howdy world", new Node[] { new Node("min", 4), new Node("max", 7) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.string", args));
        }

        [Fact]
        public void VerifyUrl()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "http://foo.com");
            signaler.Signal("validators.url", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyHttpsUrl()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "https://foo.com");
            signaler.Signal("validators.url", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyUrl_FAILS()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo.com");
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.url", args));
        }

        [Fact]
        public void VerifyDate_01()
        {
            var signaler = Common.Initialize();
            var args = new Node("", DateTime.UtcNow, new Node[] { new Node("min", DateTime.UtcNow.AddSeconds(-5)), new Node("max", DateTime.UtcNow.AddSeconds(5)) });
            signaler.Signal("validators.date", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyDate_02()
        {
            var signaler = Common.Initialize();
            var args = new Node("", DateTime.UtcNow);
            signaler.Signal("validators.date", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyDate_FAILS_01()
        {
            var signaler = Common.Initialize();
            var args = new Node("", DateTime.UtcNow.AddSeconds(10), new Node[] { new Node("min", DateTime.UtcNow.AddSeconds(-5)), new Node("max", DateTime.UtcNow.AddSeconds(5)) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.date", args));
        }

        [Fact]
        public void VerifyDate_FAILS_02()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "not a date!");
            Assert.Throws<FormatException>(() => signaler.Signal("validators.date", args));
        }

        [Fact]
        public void VerifyDate_FAILS_03()
        {
            var signaler = Common.Initialize();
            var args = new Node("", DateTime.UtcNow.AddSeconds(-10), new Node[] { new Node("min", DateTime.UtcNow.AddSeconds(-5)), new Node("max", DateTime.UtcNow.AddSeconds(5)) });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.date", args));
        }

        [Fact]
        public void VerifyEnum()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo", new Node[] { new Node("", "foo"), new Node("", "bar") });
            signaler.Signal("validators.enum", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyEnum_FAILS()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo1", new Node[] { new Node("", "foo"), new Node("", "bar") });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.enum", args));
        }

        #pragma warning disable S2699
        [Fact]
        public void VerifyMandatory()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo");
            signaler.Signal("validators.mandatory", args);
        }
        #pragma warning restore S2699

        [Fact]
        public void VerifyMandator_FAILS()
        {
            var signaler = Common.Initialize();
            var args = new Node("");
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.mandatory", args));
        }

        [Fact]
        public void VerifyRegEx()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo", new Node[] { new Node("regex", "^foo$") });
            signaler.Signal("validators.regex", args);
            Assert.Null(args.Value);
            Assert.Empty(args.Children);
        }

        [Fact]
        public void VerifyRegEx_FAILS()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo_XXX", new Node[] { new Node("regex", "^foo$") });
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("validators.regex", args));
        }

        #pragma warning disable S2699
        [Fact]
        public void ValidateMultipleNodes()
        {
            Common.Evaluate(@".arguments
   foo
      objects
         .
            no:5
         .
            no:10
validators.integer:x:@.arguments/*/foo/*/objects/*/*/no
   min:5
   max:10");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void ValidateMandatoryExpression()
        {
            Common.Evaluate(@".arguments
   foo:bar
validators.mandatory:x:@.arguments/*/foo");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void ValidateMandatoryExpressionWithChildren()
        {
            Common.Evaluate(@".arguments
   foo
      actual:value
validators.mandatory:x:@.arguments/*/foo");
        }
        #pragma warning restore S2699

        [Fact]
        public void ValidateEmailExpression_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".arguments
   foo:""Thomas Hansen <foo@bar.com>""
validators.email:x:@.arguments/*/foo"));
        }

        #pragma warning disable S2699
        [Fact]
        public void ValidateInteger()
        {
            Common.Evaluate(@".arguments
   foo:int:5
validators.integer:x:@.arguments/*/foo");
        }
        #pragma warning restore S2699

        [Fact]
        public void ValidateMultipleNodes_FAILS()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".arguments
   foo
      objects
         .
            no:5
         .
            no:11
validators.integer:x:@.arguments/*/foo/*/objects/*/*/no
   min:5
   max:10"));
        }

        [Fact]
        public void VerifyDefault_01()
        {
            var result = Common.Evaluate(@".arguments
validators.default:x:@.arguments
   foo1:bar1");
            Assert.Single(result.Children.First().Children);
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_02()
        {
            var result = Common.Evaluate(@".arguments
   foo1:bar2
validators.default:x:@.arguments
   foo1:bar1");
            Assert.Single(result.Children.First().Children);
            Assert.Equal("bar2", result.Children.First().Children.First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_03()
        {
            var result = Common.Evaluate(@".arguments
   foo1:bar1
validators.default:x:@.arguments
   foo2:bar2");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
            Assert.Equal("bar2", result.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_04()
        {
            var result = Common.Evaluate(@".arguments
validators.default:x:@.arguments
   foo1:bar1
   foo2:bar2");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
            Assert.Equal("bar2", result.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_05()
        {
            var result = Common.Evaluate(@".arguments
   foo1:bar1
validators.default:x:@.arguments
   foo1:bar1
   foo2:bar2");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
            Assert.Equal("bar2", result.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_06()
        {
            var result = Common.Evaluate(@".arguments
   foo1
validators.default:x:@.arguments
   foo1:bar1
   foo2:bar2");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
            Assert.Equal("bar2", result.Children.First().Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void VerifyDefault_07()
        {
            var result = Common.Evaluate(@".arguments
   foo1
validators.default:x:@.arguments
   foo1:bar1
   foo2:bar2");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("bar1", result.Children.First().Children.First().Get<string>());
            Assert.Equal("bar2", result.Children.First().Children.Skip(1).First().Get<string>());
            Assert.Equal("foo1", result.Children.First().Children.First().Name);
            Assert.Equal("foo2", result.Children.First().Children.Skip(1).First().Name);
        }
    }
}
