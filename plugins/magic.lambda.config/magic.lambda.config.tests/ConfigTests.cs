/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Xunit;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.config.tests
{
    public class ConfigTests
    {
        [Fact]
        public void CheckConfigurationSetting()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "foo-value");
            signaler.Signal("config.get", args);
            Assert.Equal("bar-xx", args.Get<string>());
        }

        [Fact]
        public void CheckConfigurationSettingThrows()
        {
            var signaler = Common.Initialize();
            var args = new Node("");
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("config.get", args));
        }

        [Fact]
        public void ConfigGetSignatureDocumentsWildcardDefaultSource()
        {
            var signaler = Common.Initialize();
            var args = new Node("", "config.get");
            signaler.Signal("slot.signature", args);
            var children = args.Children.First(x => x.Name == "children");
            var fallback = children.Children.First();

            Assert.Equal("*", fallback.Name);
            Assert.Equal("Default value source evaluated and returned when the configuration key does not exist", fallback.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), fallback.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.SourceExpression.ToString(), fallback.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), fallback.Children.First(x => x.Name == "projection").GetEx<string>());
        }
    }
}
