/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.config
{
    /// <summary>
    /// [config.section] slot for retrieving a configuration section.
    /// </summary>
    [Slot(Name = "config.section")]
    public class ConfigSection : ISlot
    {
        readonly IMagicConfiguration _configuration;

        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="configuration">Configuration settings for your application.</param>
        public ConfigSection(IMagicConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to signal your slot.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var section = _configuration.GetSection(input.GetEx<string>() ?? throw new HyperlambdaException("No value provided to [config.section]"));
            input.AddRange(section.Select(x => new Node(x.Key, x.Value)));
        }
    }
}
