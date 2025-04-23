/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using YamlDotNet.Serialization;
using magic.node;
using magic.signals.contracts;
using magic.lambda.json.utilities;

namespace magic.lambda.json.slots.lambda
{
    /// <summary>
    /// [lambda2yaml] slot for transforming a lambda object to a YAML string.
    /// </summary>
    [Slot(Name = "lambda2yaml")]
    public class Lambda2Yaml : ISlot
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

            // House cleaning.
            input.Clear();

            // Creating our serializer.
            var serializer = new SerializerBuilder()
                .WithNewLine("\r\n")
                .Build();

            // Converting to YAML.
            input.Value = serializer.Serialize(SimplifyJContainer(jContainer));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Converts the specified JToken to a "simple object" that YamlDotNet can understand.
         */
        static object SimplifyJContainer(JToken token)
        {
            if (token is JValue jValue)
                return jValue.Value;
            if (token is JArray jArray)
                return jArray.Select(x => SimplifyJContainer(x)).ToList();
            if (token is JObject)
                return token.AsEnumerable().Cast<JProperty>().ToDictionary(x => x.Name, x => SimplifyJContainer(x.Value));
            throw new InvalidOperationException("Unexpected token: " + token);
        }

        #endregion
    }
}
