/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.system.plugins
{
    /// <summary>
    /// [system.plugin.list] slot returning a list of all dynamically create plugins.
    /// </summary>
    [Slot(Name = "system.plugin.list")]
    public class ListPlugins : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // House cleaning.
            input.Value = null;
            input.Clear();

            // Returning all dynamically created plugins to caller.
            input.AddRange(LoadPlugin._loadContexts.Keys.Select(x => new Node(".", x)));
        }
    }
}
