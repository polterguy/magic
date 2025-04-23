/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.json.utilities;

namespace magic.lambda.json.slots.json
{
    /// <summary>
    /// [json2lambda] slot for transforming a piece of JSON to a lambda hierarchy.
    /// </summary>
    [Slot(Name = "json2lambda")]
    public class Json2Lambda : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Clear();
            Json2LambdaTransformer.ToNode(input, JContainer.Parse(input.GetEx<string>()) as JContainer);
            input.Value = null;
        }
    }
}
