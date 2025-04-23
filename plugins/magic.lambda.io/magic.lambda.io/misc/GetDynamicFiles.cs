/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.contracts;
using magic.signals.contracts;

namespace magic.lambda.io.misc
{
    /// <summary>
    /// [.io.folder.root] slot for returning root path of system.
    /// </summary>
    [Slot(Name = ".io.folder.root")]
    public class GetDynamicFiles : ISlot
    {
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        public GetDynamicFiles(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = _rootResolver.DynamicFiles;
        }
    }
}
