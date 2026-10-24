/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.json.slots.lambda
{
    /// <summary>
    /// [.lambda2json-raw] slot for transforming to a compact JSON string, used internally by
    /// the endpoint executor and the exception handler.
    /// </summary>
    [Slot(
        Name = ".lambda2json-raw",
        Description = "Transforms a lambda hierarchy into a JSON string, used internally",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "json,text",
        ReturnsDescription = "Resolves to the generated JSON string",
        SignatureType = typeof(global::magic.lambda.json.signatures.Lambda2JsonRawSignature))]
    public class Lambda2JsonRaw : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = NodeJson.ToJson(input);
            input.Clear();
        }
    }
}
