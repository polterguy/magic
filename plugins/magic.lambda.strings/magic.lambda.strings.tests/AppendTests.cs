/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.tests
{
    public class AppendTests
    {
        [Fact]
        public void Append()
        {
            var lambda = Common.Evaluate(@"
strings.builder
   strings.builder.append:""howdy""
   strings.builder.append:"" world""
get-value:x:@strings.builder
");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task AppendAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
strings.builder
   strings.builder.append:""howdy""
   strings.builder.append:"" world""
get-value:x:@strings.builder
");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void BuilderSignatureDocumentsScopedAppendBody()
        {
            var result = Common.Evaluate("slot.signature:strings.builder");
            var signature = result.Children.First();
            var children = signature.Children.First(x => x.Name == "children");
            var body = children.Children.First();
            var output = signature.Children.First(x => x.Name == "output");

            Assert.Equal("text", output.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("*", body.Name);
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), body.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.ExecutableBody.ToString(), body.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalSelf.ToString(), body.Children.First(x => x.Name == "evaluation").GetEx<string>());
        }
    }
}
