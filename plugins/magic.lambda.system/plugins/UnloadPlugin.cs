/*
 * Magic Cloud, copyright AINIRO.IO, Ltd, Ltd and Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Reflection;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.plugins
{
    /// <summary>
    /// [system.plugin.unload] slot that will unload a previously loaded assembly.
    /// </summary>
    [Slot(Name = "system.plugin.unload")]
    public class UnloadPlugin : ISlot
    {
        readonly ISignalsProvider _provider;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="provider">Signals provider required to initialize any slots found in the assembly.</param>
        public UnloadPlugin(ISignalsProvider provider)
        {
            _provider = provider;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Figuring out absolute path of DLL.
            var asmName = input.GetEx<string>();

            // Getting our Assembly Load Context, making sure we haven't previously loaded the assembly.
            if (!LoadPlugin._loadContexts.TryGetValue(asmName, out var asmLoadContext))
                throw new HyperlambdaException($"Assembly {asmName} does not exists");

            // Unloading assembly.
            Unload(_provider, asmName, asmLoadContext);

            // House cleaning.
            input.Value = null;
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to load assemblies.
         */
        internal static void Unload(
            ISignalsProvider provider,
            string asmName,
            (CollectibleAssemblyLoadContext Context, Assembly Assembly) asmLoadContext)
        {
            // Finding all slot types in assembly.
            var slots = asmLoadContext.Assembly.GetTypes()
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsInterface && !x.IsAbstract);

            // Removing type as slot resolver.
            foreach (var idxType in slots)
            {
                provider.Remove(idxType);
            }

            // Removing reference to Load Context.
            LoadPlugin._loadContexts.TryRemove(asmName, out var _);
        }

        #endregion
    }
}
