/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Reflection;
using Xunit;
using magic.signals.contracts;
using magic.lambda.git.signatures;

namespace magic.lambda.git.tests
{
    public class BareSignatureTests
    {
        sealed class Bare : GitSignature
        {
        }

        [Fact]
        public void TheBaseClassDescribesNothing()
        {
            ISlotSignature signature = new Bare();
            Assert.Empty(signature.Children);
            Assert.Empty(signature.Constraints);
            Assert.Empty(signature.OutputChildren);
        }

        [Fact]
        public void EverySignatureDescribesItself()
        {
            var signatures = Assembly.Load("magic.lambda.git").GetTypes()
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
        public void EverySlotIsNamedGitOrGitHub()
        {
            var slots = Assembly.Load("magic.lambda.git").GetTypes()
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsAbstract && !x.IsInterface)
                .Select(x => x.GetCustomAttribute<SlotAttribute>())
                .ToList();
            Assert.Equal(18, slots.Count);
            Assert.All(slots, x => Assert.True(x.Name.StartsWith("git.", StringComparison.Ordinal) || x.Name.StartsWith("github.", StringComparison.Ordinal)));
        }
    }
}
