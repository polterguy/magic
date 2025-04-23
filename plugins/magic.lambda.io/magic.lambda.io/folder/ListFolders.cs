/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.folder
{
    /// <summary>
    /// [io.folder.list] slot for listing folders on server.
    /// </summary>
    [Slot(Name = "io.folder.list")]
    [Slot(Name = "io.folder.list-recursively")]
    public class ListFolders : ISlot
    {
        readonly IRootResolver _rootResolver;
        readonly IFolderService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public ListFolders(IRootResolver rootResolver, IFolderService service)
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

            // Retrieving folders.
            var folders = input.Name == "io.folder.list" ?
                _service.List(_rootResolver.AbsolutePath(args.Folder)) :
                _service.ListAll(_rootResolver.AbsolutePath(args.Folder));

            // Returning folders as lambda to caller.
            foreach (var idx in folders)
            {
                // Adds currently iterated folder to result.
                AddFolder(input, idx, args.ShowHidden, args.ShowSystem);
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns arguments to slot invocation.
         */
        (string Folder, bool ShowHidden, bool ShowSystem) GetArgs(Node input)
        {
            // Checking if we should display hidden files (files starting with ".").
            var displayHiddenFolders = input.Children
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
            return (folder, displayHiddenFolders, displaySystemFolders);
        }

        /*
         * Adds one file to result.
         */
        void AddFolder(Node result, string folderName, bool showHidden, bool showSystem)
        {
            // Making sure we don't show hidden operating system files by default.
            var folderInfo = new DirectoryInfo(folderName);
            if (showHidden || !folderInfo.Name.StartsWith("."))
            {
                var relFolder = _rootResolver.RelativePath(folderName);
                if (showSystem || (!relFolder.StartsWith("/system/") && !relFolder.StartsWith("/misc/") && !relFolder.StartsWith("/data/") && !relFolder.StartsWith("/config/")))
                    result.Add(new Node("", relFolder));
            }
        }

        #endregion
    }
}
