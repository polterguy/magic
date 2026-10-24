/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using YamlDotNet.Serialization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.json.slots.json
{
    /// <summary>
    /// [json2yaml] slot for transforming a piece of JSON to a YAML string.
    /// </summary>
    [Slot(
        Name = "json2yaml",
        Description = "Transforms JSON into YAML",
        ValueKind = "json",
        ValueDescription = "JSON text to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "yaml,text",
        ReturnsDescription = "Resolves to the generated YAML string")]
    public class Json2Yaml : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // House cleaning.
            input.Clear();

            // Converting to JSON object.
            var deserializedObject = NodeJson.ParseObject(input.GetEx<string>());

            // Converting to YAML.
            var serializer = new SerializerBuilder().Build();
            input.Value = serializer.Serialize(deserializedObject);
        }
    }
}
