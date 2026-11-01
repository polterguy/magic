/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Reflection;
using Xunit;
using magic.signals.contracts;

namespace magic.lambda.python.tests
{
    public class SignatureTests
    {
        [Fact]
        public void EverySignatureDescribesItself()
        {
            var signatures = Assembly.Load("magic.lambda.python").GetTypes()
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
        public void ExecuteDeclaresItsArgumentsAndTheCodeOrFileConstraint()
        {
            var signature = (ISlotSignature)Activator.CreateInstance(typeof(PythonExecute).GetCustomAttribute<SlotAttribute>().SignatureType);
            var names = signature.Children.Select(x => x.Name).ToList();
            Assert.Contains("code", names);
            Assert.Contains("file", names);
            Assert.Contains("timeout", names);
            Assert.NotEmpty(signature.Constraints);
        }
    }
}
