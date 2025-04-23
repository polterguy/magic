/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.list] slot for listing files on server.
    /// </summary>
    [Slot(Name = "io.file.list")]
    [Slot(Name = "io.file.list-recursively")]
    public class ListFiles : ISlot
    {
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public ListFiles(IRootResolver rootResolver, IFileService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments to slot.
            var args = GetArgs(input);

            // Retrieving files.
            var files = input.Name == "io.file.list" ?
                _service.List(_rootResolver.AbsolutePath(args.Folder)) : 
                _service.ListAll(_rootResolver.AbsolutePath(args.Folder));

            // Returning files as lambda to caller.
            foreach (var idx in files)
            {
                // Adds currently iterated file to result.
                AddFile(input, idx, args.ShowHidden, args.ShowSystem);
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns arguments to slot invocation.
         */
        (string Folder, bool ShowHidden, bool ShowSystem) GetArgs(Node input)
        {
            // Checking if we should display hidden files (files starting with ".").
            var displayHiddenFiles = input.Children
                .FirstOrDefault(x => x.Name == "display-hidden")?
                .GetEx<bool>() ?? false;

            // Checking if we should display system files (files inside '/system/' and '/misc/').
            var displaySystemFolders = input.Children
                .FirstOrDefault(x => x.Name == "display-system")?
                .GetEx<bool>() ?? true;

            // Figuring out folder to list files from within.
            var folder = input.GetEx<string>();

            // House cleaning
            input.Clear();
            input.Value = null;

            // Returning results to caller.
            return (folder, displayHiddenFiles, displaySystemFolders);
        }

        /*
         * Adds one file to result.
         */
        void AddFile(Node result, string filename, bool showHidden, bool showSystem)
        {
            // Making sure we don't show hidden operating system files by default.
            if (showHidden || !Path.GetFileName(filename).StartsWith(".", StringComparison.InvariantCulture))
            {
                var relFilename = _rootResolver.RelativePath(filename);
                if (showSystem || (!relFilename.StartsWith("/system/") && !relFilename.StartsWith("/misc/") && !relFilename.StartsWith("/data/") && !relFilename.StartsWith("/config/")))
                    result.Add(new Node("", relFilename));
            }
        }

        #endregion
    }
}
