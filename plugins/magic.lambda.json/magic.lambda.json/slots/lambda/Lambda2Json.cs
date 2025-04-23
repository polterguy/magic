/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.json.utilities;

namespace magic.lambda.json.slots.lambda
{
    /// <summary>
    /// [lambda2json] slot for transforming a lambda hierarchy to a JSON string.
    /// </summary>
    [Slot(Name = "lambda2json")]
    public class Lambda2Json : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Getting source nodes and converting to JContainer.
            var jContainer = Lambda2JsonTransformer.ToJson(Lambda2JsonTransformer.GetSourceNode(input));

            // Checking if caller wants to have a formatted result.
            var format = input.Children.FirstOrDefault(x => x.Name == "format")?.GetEx<bool>() ?? false;

            // House cleaning.
            input.Clear();

            // Converting to JSON string and returning to caller.
            input.Value = jContainer.ToString(format ? Newtonsoft.Json.Formatting.Indented : Newtonsoft.Json.Formatting.None);
        }
    }
}
