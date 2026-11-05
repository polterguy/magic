/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Reflection;
using Xunit;
using magic.signals.contracts;

namespace magic.lambda.puppeteer.tests
{
    public class SignatureTests
    {
        [Fact]
        public void EverySignatureDescribesItself()
        {
            var signatures = Assembly.Load("magic.lambda.puppeteer").GetTypes()
                .Where(x => typeof(ISlotSignature).IsAssignableFrom(x) && !x.IsAbstract && !x.IsInterface)
                .ToList();
            Assert.NotEmpty(signatures);
            foreach (var type in signatures)
            {
                var signature = (ISlotSignature)Activator.CreateInstance(type);
                foreach (var child in signature.Children.Concat(signature.OutputChildren))
                    Assert.False(string.IsNullOrEmpty(child.Name), $"{type.Name} has a child without a name");
                Assert.NotNull(signature.Constraints.ToList());
            }
        }

        [Fact]
        public void EverySlotIsNamedInThePuppeteerNamespace()
        {
            var slots = Assembly.Load("magic.lambda.puppeteer").GetTypes()
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsAbstract && !x.IsInterface)
                .Select(x => x.GetCustomAttribute<SlotAttribute>())
                .ToList();
            Assert.Equal(15, slots.Count);
            Assert.All(slots, x => Assert.StartsWith("puppeteer.", x.Name));
            Assert.Equal(slots.Count, slots.Select(x => x.Name).Distinct().Count());
        }
    }
}
