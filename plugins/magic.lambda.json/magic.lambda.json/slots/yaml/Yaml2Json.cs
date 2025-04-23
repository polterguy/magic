/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using YamlDotNet.Serialization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.json.slots.yaml
{
    /// <summary>
    /// [yaml2json] slot for transforming a piece of YAML to a JSON string.
    /// </summary>
    [Slot(Name = "yaml2json")]
    public class Yaml2Json : ISlot
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

            // Getting YAML content.
            var yaml = input.GetEx<string>();

            // Creating a string reader that we can pass to YAML lib.
            using (var reader = new StringReader(yaml))
            {
                // Serializing to JSON first for simplicity reasons, such that we can reuse JSON logic to create lambda hierarchy.
                var deserializer = new DeserializerBuilder().Build();
                var yamlObject = deserializer.Deserialize(reader);
                var serializer = new SerializerBuilder()
                    .JsonCompatible()
                    .WithNewLine("\r\n")
                    .Build();
                input.Value = serializer.Serialize(yamlObject);
            }
        }
    }
}
