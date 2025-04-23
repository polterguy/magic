/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.json.tests
{
    public class JsonTests
    {
        [Fact]
        public void FromJsonSimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
        }

        [Fact]
        public void FromJsonSimpleObjectRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
        }

        [Fact]
        public void FromJsonSimpleObjectBoolean()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo1"":true,""foo2"":false}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo1", node.Children.First().Name);
            Assert.Equal(true, node.Children.First().Value);
            Assert.Equal("foo2", node.Children.Skip(1).First().Name);
            Assert.Equal(false, node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonSimpleObjectBooleanRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo1"":true,""foo2"":false}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo1", node.Children.First().Name);
            Assert.Equal(true, node.Children.First().Value);
            Assert.Equal("foo2", node.Children.Skip(1).First().Name);
            Assert.Equal(false, node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonMultipleProperties()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5, ""bar"": ""howdy""}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal("bar", node.Children.Skip(1).First().Name);
            Assert.Equal("howdy", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonMultiplePropertiesRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5, ""bar"": ""howdy""}");
            signaler.Signal("json2lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal("bar", node.Children.Skip(1).First().Name);
            Assert.Equal("howdy", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfIntegers()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[5, 6, 7]");
            signaler.Signal("json2lambda", node);
            Assert.Equal(".", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal(".", node.Children.Skip(1).First().Name);
            Assert.Equal(6L, node.Children.Skip(1).First().Value);
            Assert.Equal(".", node.Children.Skip(2).First().Name);
            Assert.Equal(7L, node.Children.Skip(2).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfIntegersRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[5, 6, 7]");
            signaler.Signal("json2lambda", node);
            Assert.Equal(".", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal(".", node.Children.Skip(1).First().Name);
            Assert.Equal(6L, node.Children.Skip(1).First().Value);
            Assert.Equal(".", node.Children.Skip(2).First().Name);
            Assert.Equal(7L, node.Children.Skip(2).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfObjects()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[{""foo1"": ""bar1""}, {""foo2"": ""bar2""}]");
            signaler.Signal("json2lambda", node);
            Assert.Equal(".", node.Children.First().Name);
            Assert.Equal("foo1", node.Children.First().Children.First().Name);
            Assert.Equal("bar1", node.Children.First().Children.First().Value);
            Assert.Equal(".", node.Children.Skip(1).First().Name);
            Assert.Equal("foo2", node.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("bar2", node.Children.Skip(1).First().Children.First().Value);
        }

        [Fact]
        public void FromJsonArrayOfObjectsRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[{""foo1"": ""bar1""}, {""foo2"": ""bar2""}]");
            signaler.Signal("json2lambda", node);
            Assert.Equal(".", node.Children.First().Name);
            Assert.Equal("foo1", node.Children.First().Children.First().Name);
            Assert.Equal("bar1", node.Children.First().Children.First().Value);
            Assert.Equal(".", node.Children.Skip(1).First().Name);
            Assert.Equal("foo2", node.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("bar2", node.Children.Skip(1).First().Children.First().Value);
        }

        [Fact]
        public void FromJsonArrayOfComplexObjects()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[{""foo1"": {""name"": ""thomas""}}, {""foo2"": {""name"": ""hansen""}}]");
            signaler.Signal("json2lambda", node);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(@".
   foo1
      name:thomas
.
   foo2
      name:hansen
".Replace("\r", "").Replace("\n", "\r\n"), node.Value);
        }

        [Fact]
        public void FromJsonComplexObjectWithArray()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":[{""foo1"":5}, {""foo2"":{""bar1"":7, ""boolean"":true}}], ""jo"":""dude""}");
            signaler.Signal("json2lambda", node);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(@"foo
   .
      foo1:long:5
   .
      foo2
         bar1:long:7
         boolean:bool:true
jo:dude
".Replace("\r", "").Replace("\n", "\r\n"), node.Value);
        }

        [Fact]
        public void FromJsonComplexObjectWithArrayRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":[{""foo1"":5}, {""foo2"":{""bar1"":7, ""boolean"":true}}], ""jo"":""dude""}");
            signaler.Signal("json2lambda", node);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(@"foo
   .
      foo1:long:5
   .
      foo2
         bar1:long:7
         boolean:bool:true
jo:dude
".Replace("\r", "").Replace("\n", "\r\n"), node.Value);
        }

        [Fact]
        public void ToJsonSimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
foo1
foo2:bar2
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal("lambda2json", node);
            Assert.Equal(@"{""foo1"":null,""foo2"":""bar2""}", node.Value);
        }

        [Fact]
        public void ToJsonSimpleObjectFormat()
        {
            var signaler = Common.GetSignaler();
            var node = HyperlambdaParser.Parse(@"
.lambda
   foo1
   foo2:bar2
lambda2json:x:-/*
   format:bool:true
");
            signaler.Signal("eval", node);
            var json = node.Children.Skip(1).First().Get<string>();
            Assert.Equal("{\n  \"foo1\": null,\n  \"foo2\": \"bar2\"\n}", json.Replace("\r\n", "\n"));
        }

        [Fact]
        public void ToJsonSimpleObjectRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
foo1
foo2:bar2
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal(".lambda2json-raw", node);
            Assert.Equal(@"{""foo1"":null,""foo2"":""bar2""}", node.Get<JContainer>().ToString(Newtonsoft.Json.Formatting.None));
        }

        [Fact]
        public void ToJsonSimpleArray_01()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
:int:5
:int:7
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal("lambda2json", node);
            Assert.Equal(@"[5,7]", node.Value);
        }

        [Fact]
        public void ToJsonSimpleArray_01_Raw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
:int:5
:int:7
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal(".lambda2json-raw", node);
            Assert.Equal(@"[5,7]", node.Get<JContainer>().ToString(Newtonsoft.Json.Formatting.None));
        }

        [Fact]
        public void ToJsonSimpleArray_02()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.:int:5
.:int:7
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal("lambda2json", node);
            Assert.Equal(@"[5,7]", node.Value);
        }

        [Fact]
        public void ToJsonComplexArray_01()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1:bar1
.
   foo2:bar2
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal("lambda2json", node);
            Assert.Equal(@"[{""foo1"":""bar1""},{""foo2"":""bar2""}]", node.Value);
        }

        [Fact]
        public void ToJsonComplexArray_02()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1
      foo11:bar11
.
   foo2
      foo22:bar22
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal("lambda2json", node);
            Assert.Equal(@"[{""foo1"":{""foo11"":""bar11""}},{""foo2"":{""foo22"":""bar22""}}]", node.Value);
        }

        [Fact]
        public void ToJsonSimpleArray_02_Raw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.:int:5
.:int:7
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal(".lambda2json-raw", node);
            Assert.Equal(@"[5,7]", node.Get<JContainer>().ToString(Newtonsoft.Json.Formatting.None));
        }

        [Fact]
        public void ToJsonComplexArray_01_Raw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1:bar1
.
   foo2:bar2
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal(".lambda2json-raw", node);
            Assert.Equal(@"[{""foo1"":""bar1""},{""foo2"":""bar2""}]", node.Get<JContainer>().ToString(Newtonsoft.Json.Formatting.None));
        }

        [Fact]
        public void ToJsonComplexArray_02_Raw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1
      foo11:bar11
.
   foo2
      foo22:bar22
");
            signaler.Signal("hyper2lambda", node);
            signaler.Signal(".lambda2json-raw", node);
            Assert.Equal(@"[{""foo1"":{""foo11"":""bar11""}},{""foo2"":{""foo22"":""bar22""}}]", node.Get<JContainer>().ToString(Newtonsoft.Json.Formatting.None));
        }

        [Fact]
        public void ToJsonHyperlambdaInvocation_01()
        {
            var lambda = Common.Evaluate(@"
lambda2json
   foo:howdy
   bar:hello
json2lambda:x:-
");
            Assert.Equal(@"{""foo"":""howdy"",""bar"":""hello""}", lambda.Children.First().Get<string>());
            Assert.Equal("json2lambda\r\n   foo:howdy\r\n   bar:hello\r\n", lambda.Children.Skip(1).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocation_02()
        {
            var lambda = Common.Evaluate(@"
lambda2json
   .:howdy
   .:hello
json2lambda:x:-
");
            Assert.Equal(@"[""howdy"",""hello""]", lambda.Children.First().Get<string>());
            Assert.Equal("json2lambda\r\n   .:howdy\r\n   .:hello\r\n", lambda.Children.Skip(1).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocation_03()
        {
            var lambda = Common.Evaluate(@"
lambda2json
   .:howdy
   .
      foo1:int:5
json2lambda:x:-
");
            Assert.Equal(@"[""howdy"",{""foo1"":5}]", lambda.Children.First().Get<string>());
            Assert.Equal("json2lambda\r\n   .:howdy\r\n   .\r\n      foo1:long:5\r\n", lambda.Children.Skip(1).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocation_04()
        {
            var lambda = Common.Evaluate(@"
lambda2json
   .:howdy
   .
      foo1:bar1
      foo2:int:5
json2lambda:x:-
");
            Assert.Equal(@"[""howdy"",{""foo1"":""bar1"",""foo2"":5}]", lambda.Children.First().Get<string>());
            Assert.Equal("json2lambda\r\n   .:howdy\r\n   .\r\n      foo1:bar1\r\n      foo2:long:5\r\n", lambda.Children.Skip(1).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocationWithDate_05()
        {
            var lambda = Common.Evaluate(@"
lambda2json
   .:date:""2020-01-01T23:59:11""
   .
      foo1:bar1
      foo2:int:5
json2lambda:x:-
");
            Assert.Equal(@"[""2020-01-01T23:59:11"",{""foo1"":""bar1"",""foo2"":5}]", lambda.Children.First().Get<string>());
            Assert.Equal("json2lambda\r\n   .:date:\"2020-01-01T23:59:11.000\"\r\n   .\r\n      foo1:bar1\r\n      foo2:long:5\r\n", lambda.Children.Skip(1).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocation_06()
        {
            var lambda = Common.Evaluate(@"
.foo
   .:date:""2020-01-01T23:59:11""
   .
      foo1:bar1
      foo2:int:5
lambda2json:x:-/*
json2lambda:x:-
");
            Assert.Equal(@"[""2020-01-01T23:59:11"",{""foo1"":""bar1"",""foo2"":5}]", lambda.Children.Skip(1).First().Get<string>());
            Assert.Equal("json2lambda\r\n   .:date:\"2020-01-01T23:59:11.000\"\r\n   .\r\n      foo1:bar1\r\n      foo2:long:5\r\n", lambda.Children.Skip(2).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocationFormat_07()
        {
            var lambda = Common.Evaluate(@"
.foo
   .:date:""2020-01-01T23:59:11""
   .
      foo1:bar1
      foo2:int:5
lambda2json:x:-/*
   format:true
json2lambda:x:-
");
            Assert.Equal("[\n  \"2020-01-01T23:59:11\",\n  {\n    \"foo1\": \"bar1\",\n    \"foo2\": 5\n  }\n]", lambda.Children.Skip(1).First().Get<string>().Replace("\r\n", "\n"));
            Assert.Equal("json2lambda\r\n   .:date:\"2020-01-01T23:59:11.000\"\r\n   .\r\n      foo1:bar1\r\n      foo2:long:5\r\n", lambda.Children.Skip(2).First().ToHyperlambda());
        }

        [Fact]
        public void ToJsonHyperlambdaInvocationFormat_08()
        {
            var lambda = Common.Evaluate(@"
.foo
lambda2json:x:-/*
json2lambda:x:-
");
            Assert.Equal(@"{}", lambda.Children.Skip(1).First().Get<string>());
            Assert.Equal("json2lambda\r\n", lambda.Children.Skip(2).First().ToHyperlambda());
        }

        [Fact]
        public void Yaml2JSON()
        {
            var lambda = Common.Evaluate(@"
.yaml:@""
foo: howdy
bar: jo
children:
- howdy
- some
""
yaml2json:x:-
");
            Assert.Equal(@"{""foo"": ""howdy"", ""bar"": ""jo"", ""children"": [""howdy"", ""some""]}" + "\r\n", lambda.Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void Yaml2Lambda2JSON()
        {
            var lambda = Common.Evaluate(@"
.yaml:@""
foo: howdy
bar: jo
children:
- howdy
- some
""
yaml2lambda:x:@.yaml
lambda2json:x:-/*
");
            Assert.Equal(@"{""foo"":""howdy"",""bar"":""jo"",""children"":[""howdy"",""some""]}", lambda.Children.Skip(2).First().Get<string>());
        }

        [Fact]
        public void YamlRoundtrip01()
        {
            var lambda = Common.Evaluate(@"
.yaml:@""foo: howdy
bar: jo
children:
- howdy
- some
""
yaml2lambda:x:@.yaml
lambda2yaml:x:-/*
");
            Assert.Equal(lambda.Children.First().Get<string>(), lambda.Children.Skip(2).First().Get<string>());
        }
    }
}
