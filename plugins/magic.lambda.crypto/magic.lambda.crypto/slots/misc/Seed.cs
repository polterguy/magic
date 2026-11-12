/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Text;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.seed] slot allowing you to explicitly seed the CSRNG instance.
    /// </summary>
    [Slot(
        Name = "crypto.seed",
        Description = "Adds entropy to the secure random number generator; useful when supplying additional out-of-band randomness",
        ValueKind = "crypto-seed,text",
        ValueDescription = "Seed value for the random generator",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Seed : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var seedStr = input.GetEx<string>() ?? throw new HyperlambdaException("No value provided to [crypto.seed]");

            // Mixing the supplied entropy into the shared CSPRNG that the [crypto.random*] slots draw from.
            SharedRandom.AddSeed(Encoding.UTF8.GetBytes(seedStr));
            input.Value = null;
        }
    }
}
