/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using Newtonsoft.Json.Linq;
using YamlDotNet.Serialization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.json.utilities;

namespace magic.lambda.json.slots.yaml
{
    /// <summary>
    /// [yaml2lambda] slot for transforming a piece of YAML to a lambda hierarchy.
    /// </summary>
    [Slot(Name = "yaml2lambda")]
    public class Yaml2Lambda : ISlot
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
                var serializer = new SerializerBuilder().JsonCompatible().Build();
                string json = serializer.Serialize(yamlObject);

                // Creating lambda object from JSON content.
                Json2LambdaTransformer.ToNode(input, JContainer.Parse(json) as JContainer);

                // House cleaning.
                input.Value = null;
            }
        }
    }
}
