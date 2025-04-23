/*
 * Magic Cloud, copyright AINIRO, Ltd and Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.contracts;
using magic.signals.contracts;

namespace magic.lambda.system.plugins
{
    /// <summary>
    /// [system.plugin.execute] slot combining load and unload with a lambda object allowing you
    /// to execute dynamically loaded C# code in a scope which automatically cleans up the dynamically
    /// loaded plugin.
    /// </summary>
    [Slot(Name = "system.plugin.execute")]
    public class ExecutePlugin : ISlot
    {
        readonly IRootResolver _rootResolver;
        readonly ISignalsProvider _provider;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="provider">Signals provider required to initialize any slots found in the assembly.</param>
        public ExecutePlugin(IRootResolver rootResolver, ISignalsProvider provider)
        {
            _rootResolver = rootResolver;
            _provider = provider;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Loading plugin.
            var plugin = LoadPlugin.Load(_provider, _rootResolver, input);

            // Making sure we're able to clean up after ourselves.
            try
            {
                // Executing lambda object not with plugin dynamically loaded into AppDomain.
                signaler.Signal("eval", input);
            }
            finally
            {
                UnloadPlugin.Unload(_provider, plugin.Assembly.GetName().Name, plugin);
            }

            // House cleaning.
            input.Value = null;
        }
    }
}
