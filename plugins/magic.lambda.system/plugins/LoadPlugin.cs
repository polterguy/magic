/*
 * Magic Cloud, copyright AINIRO, Ltd and Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Reflection;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using System.Collections.Concurrent;

namespace magic.lambda.system.plugins
{
    /// <summary>
    /// [system.plugin.load] slot that will load an assembly and inject into the current AppDomain
    /// making sure it initializes any slots found in the assembly.
    /// </summary>
    [Slot(Name = "system.plugin.load")]
    public class LoadPlugin : ISlot
    {
        readonly IRootResolver _rootResolver;
        readonly ISignalsProvider _provider;
        readonly static internal ConcurrentDictionary<string, (CollectibleAssemblyLoadContext Context, Assembly Assembly)> _loadContexts = new ConcurrentDictionary<string, (CollectibleAssemblyLoadContext Context, Assembly Assembly)>();

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="provider">Signals provider required to initialize any slots found in the assembly.</param>
        public LoadPlugin(IRootResolver rootResolver, ISignalsProvider provider)
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
            Load(_provider, _rootResolver, input);

            // House cleaning.
            input.Value = null;
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        internal static (CollectibleAssemblyLoadContext Context, Assembly Assembly) Load(
            ISignalsProvider provider,
            IRootResolver resolver,
            Node input)
        {
            // Figuring out name of assembly.
            var objectValue = input.GetEx<object>();

            // Creating a stream from where we load the assembly into our Assembly Loading Context.
            using (var stream = GetAssemblyStream(resolver, objectValue))
            {
                // Creating our Assembly Loading Context which allows us to unload the assembly later.
                var asmLoadContext = new CollectibleAssemblyLoadContext();

                // Loading assembly from Assembly Load Context such that we can collect it later.
                var assembly = asmLoadContext.LoadFromStream(stream);

                // Retrieving asembly name.
                var assemblyName = assembly.GetName().Name;

                // Checking if assembly has already been loaded previously.
                if (_loadContexts.TryGetValue(assemblyName, out var tmp))
                    UnloadPlugin.Unload(provider, assemblyName, tmp);

                // Finding all slots in assembly, if any, and register these with our Signals Provider.
                var slots = assembly
                    .GetTypes()
                    .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsInterface && !x.IsAbstract);
                foreach (var idx in slots)
                {
                    provider.Add(idx);
                }

                // Storing our Assembly Load Context and our assembly in our static dictionary such that we can later unload it.
                _loadContexts[assemblyName] = (asmLoadContext, assembly);
                return _loadContexts[assemblyName];
            }
        }

        /*
         * Return a stream wrapping the content of the assembly.
         */
        static Stream GetAssemblyStream(IRootResolver resolver, object objectValue)
        {
            if (objectValue is string objStr)
            {
                // Figuring out absolute path of DLL.
                var absPath = resolver.AbsolutePath(objStr);
                return File.OpenRead(absPath);
            }
            else if (objectValue is byte[] byteValue)
            {
                return new MemoryStream(byteValue);
            }

            // Unsupported type.
            throw new HyperlambdaException("Unsupported type for loading assembly in [system.load-plugin], pass in string as filepath or byte[]");
        }

        #endregion
    }
}
