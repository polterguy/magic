/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Text;
using System.IO.Compression;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.helpers;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.unzip] slot for unzipping a previously zipped file.
    /// </summary>
    [Slot(
        Name = "io.file.unzip",
        Description = "Extracts a zip archive on the server",
        ValueKind = "zip-file",
        ValueDescription = "Zip archive path to extract",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.UnzipFileSignature))]
    public class UnzipFile : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesFile;
        readonly IRootResolver _rootResolver;
        readonly IFolderService _folderService;
        readonly IStreamService _streamService;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="folderService">Needed to be able to create folders in file system.</param>
        /// <param name="streamService">Needed to be able to save unzipped files.</param>
        public UnzipFile(
            IRootResolver rootResolver,
            IFolderService folderService,
            IStreamService streamService)
        {
            _rootResolver = rootResolver;
            _folderService = folderService;
            _streamService = streamService;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitabale task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving arguments to invocation.
            var args = GetArgs(input);

            /*
             * The vocabulary decides the destination FOLDER, compared as a folder - the archive
             * itself is a file, and was already compared as one by the signaler. Every entry is
             * then confined to that folder further down, rather than compared to the vocabulary,
             * since an archive legally contains its own sub folders.
             */
            Utilities.VerifyPath(signaler, input, args.DestinationFolder, Utilities.MatchesFolder);

            // Making sure destination folder exists.
            if (!await _folderService.ExistsAsync(_rootResolver.AbsolutePath(args.DestinationFolder)))
                throw new HyperlambdaException($"Destination folder '{args.DestinationFolder}' for [io.file.unzip] does not exist.");

            // Invoking implementation method.
            await UnzipAsync(signaler, input, args.ZipFilePath, args.DestinationFolder, args.ExplicitFolder, args.Overwrite);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to unzip file.
         */
        async Task UnzipAsync(
            ISignaler signaler,
            Node input,
            string zipFilePath,
            string destinationFolder,
            bool explicitFolder,
            bool overwrite)
        {
            // Loading entire ZIP file into memory stream
            using (var sourceStream = await _streamService.OpenFileAsync(_rootResolver.AbsolutePath(zipFilePath)))
            {
                // Creating a ZIP archive wrapping memory stream.
                using (var archive = new ZipArchive(sourceStream))
                {
                    /*
                     * Checking if an explicit folder was specified, and all files are inside of the same folder in archive,
                     * at which point we trim the "root folder" from the archive entries.
                     */
                    var toTrim = explicitFolder &&
                        (archive.Entries.FirstOrDefault()?.FullName.EndsWith('/') ?? false) &&
                        archive.Entries.Skip(1).All(x => x.FullName.StartsWith(archive.Entries.First().FullName)) ?
                            archive.Entries.First().FullName.Length :
                            0;

                    // Looping through each entry in archive, ignoring garbage OS X "special files".
                    foreach (var idxEntry in archive.Entries)
                    {
                        // Verifying this is a file.
                        if (idxEntry.FullName.Split('/').Last().Contains('.', System.StringComparison.CurrentCulture))
                        {
                            // This is a file, opening it up and saving it.
                            using (var srcStream = idxEntry.Open())
                            {
                                // Getting filename.
                                var filename = idxEntry.FullName.Substring(toTrim).Replace("\\", "/");

                                // Saving currently iterated file.
                                await SaveFileAsync(signaler, input, destinationFolder, filename, srcStream, overwrite);
                            }
                        }
                    }
                }
            }
        }

        /*
         * Saves a single file from ZIP file archive.
         */
        async Task SaveFileAsync(
            ISignaler signaler,
            Node input,
            string destinationFolder,
            string filename,
            Stream contentStream,
            bool overwrite)
        {
            // Making sure we create currently iterated destination folder unless it already exists.
            var entities = filename.Split('/');
            var currentFolder = new StringBuilder(_rootResolver.AbsolutePath(destinationFolder));
            foreach (var idx in entities.Take(entities.Length - 1))
            {
                if (idx == "__MACOSX" || idx == ".DS_Store")
                    return; // Ignoring garbage OS X files

                currentFolder.Append(idx).Append('/');
                if (!await _folderService.ExistsAsync(currentFolder.ToString()))
                    await _folderService.CreateAsync(currentFolder.ToString());
            }

            // Figuring out full filename of current entry and saving it.
            var fullFileName = currentFolder + entities.Last();

            // Notice, this is what stops an archive escaping its destination with a "../" entry.
            VerifyWithinDestination(destinationFolder, filename);

            // Checking if file exists.
            if (File.Exists(_rootResolver.AbsolutePath(destinationFolder + filename)))
            {
                // Verifying caller wants to overwrite files, and if not throwing exception.
                if (overwrite)
                    File.Delete(fullFileName);
                else
                    throw new HyperlambdaException($"File {filename} already exists");
            }

            // Saving file.
            await _streamService.SaveFileAsync(contentStream, fullFileName, true);
        }

        /*
         * Verifies the specified archive entry ends up INSIDE the destination folder.
         *
         * Notice, an entry's name is attacker controlled and may contain "../" segments, hence both
         * paths are fully resolved before being compared - IRootResolver only guarantees we stay
         * within the dynamic files folder, which is a far larger place than the destination.
         */
        void VerifyWithinDestination(string destinationFolder, string filename)
        {
            var folder = FullPath(_rootResolver.AbsolutePath(destinationFolder)).TrimEnd('/') + "/";
            var entry = FullPath(_rootResolver.AbsolutePath(destinationFolder + filename));

            if (!entry.StartsWith(folder, StringComparison.Ordinal))
                throw new HyperlambdaException($"Archive entry '{filename}' is not within the destination folder of [io.file.unzip]");
        }

        /*
         * Returns the specified path fully resolved, spelled with forward slashes.
         */
        static string FullPath(string path)
        {
            return Path.GetFullPath(path).Replace('\\', '/');
        }

        /*
         * Helper method to retrieve arguments.
         */
        (string ZipFilePath, string DestinationFolder, bool ExplicitFolder, bool Overwrite) GetArgs(Node input)
        {
            // Figuring out zip file's full path.
            var zipFilePath = input.GetEx<string>();

            // Figuring out destination folder caller wants to use, defaulting to folder of ZIP file if not specified.
            var destinationFolder = input.Children
                .FirstOrDefault(x => x.Name == "folder")?
                .GetEx<string>() ?? Path.GetDirectoryName(zipFilePath) + "/";

            // Figuring out if caller specified an explicit folder.
            var explicitFolder = input.Children.Any(x => x.Name == "folder");

            // Figuring out if caller wants to overwrite existing files.
            var overwrite = input.Children.FirstOrDefault(x => x.Name == "overwrite")?.GetEx<bool>() ?? false;

            // House cleaning.
            input.Clear();
            input.Value = null;

            return (zipFilePath, destinationFolder, explicitFolder, overwrite);
        }

        #endregion
    }
}
