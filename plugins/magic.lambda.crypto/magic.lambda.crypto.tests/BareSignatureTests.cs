/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.signals.contracts;
using magic.lambda.crypto.signatures;

namespace magic.lambda.crypto.tests
{
    /*
     * A signature that adds nothing, which is what its base class describes - no children, no constraints and no output.
     */
    public class BareSignatureTests
    {
        sealed class Bare : CryptoSignature
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
    }
}
