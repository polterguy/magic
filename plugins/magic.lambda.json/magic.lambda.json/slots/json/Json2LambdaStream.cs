/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Text;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.json.utilities;

namespace magic.lambda.json.slots.json
{
    /// <summary>
    /// [json2lambda-stream] slot for transforming a piece of JSON encapsulated in a stream into a lambda hierarchy.
    /// </summary>
    [Slot(Name = "json2lambda-stream")]
    public class Json2LambdaStream : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Figuring out encoding of stream, defaulting to UTF8.
            var encoding = GetEncoding(input);

            // Loading JSON and transforming to a lambda object.
            Json2LambdaTransformer.ToNode(
                input,
                await JContainer.LoadAsync(
                    new JsonTextReader(
                        new StreamReader(input.GetEx<Stream>() ??
                            throw new HyperlambdaException("No stream object given to [json2lambda-stream]"),
                            encoding))));

            // House cleaning.
            input.Value = null;
        }

        #region [ -- Private helper methods -- ]

        Encoding GetEncoding(Node input)
        {
            var encoding = Encoding.GetEncoding(
                input.Children
                    .FirstOrDefault(x => x.Name == "encoding")?
                    .GetEx<string>() ??
                    "utf-8");
            input.Clear();
            return encoding;
        }

        #endregion
    }
}
