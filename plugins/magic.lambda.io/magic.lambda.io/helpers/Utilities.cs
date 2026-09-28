/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.helpers
{
    internal static class Utilities
    {
        /*
         * Verifies the vocabulary in scope allows this slot to touch the specified path.
         *
         * Notice, the signaler only ever sees a slot's VALUE, so a path carried anywhere else - the
         * destination of a copy, an entry written by an unzip - has to be verified here, using the
         * same comparison the slot publishes through IWhitelistComparer.
         */
        internal static void VerifyPath(ISignaler signaler, Node input, string path, Func<string, string, bool> comparer)
        {
            var whitelist = signaler.Peek<List<Node>>("whitelist");
            if (whitelist == null)
                return;

            if (!whitelist.Any(x => x.Name == input.Name && (x.Value == null || comparer(x.Get<string>(), path))))
                throw new HyperlambdaException($"Slot [{input.Name}] is not allowed to access '{path}' in current scope");
        }

        /*
         * Compares a whitelist vocabulary pin to a path.
         *
         * Exactly two wildcard patterns are legal - "/etc/*" granting every file directly IN a
         * folder, and "/etc/*.md" granting an extension within it. Neither reaches into sub folders,
         * the same way a wildcard does not in a shell. Anything else is refused rather than matched,
         * since a pattern we don't implement is a pattern whose author believed it meant something
         * it does not, and silently granting the wrong files is worse than an exception.
         */
        internal static bool MatchesFile(string pattern, string filename)
        {
            // No wildcard, hence an exact filename.
            if (!pattern.Contains('*'))
                return Wildcard.Matches(pattern, filename);

            var extension = Path.GetExtension(pattern);

            // In both legal patterns the wildcard is the ENTIRE filename, being "*" or "*.md".
            if (Path.GetFileName(pattern) != "*" + extension || extension.Contains('*'))
                throw new HyperlambdaException($"'{pattern}' is not a legal filename in a vocabulary, legal patterns are '/foo/*' and '/foo/*.md'");

            return Folder(filename) == Folder(pattern) &&
                (extension.Length == 0 || Path.GetExtension(filename) == extension);
        }

        /*
         * Compares a whitelist vocabulary pin to a FOLDER, where the only legal pattern is "/etc/*"
         * granting every folder directly within it - a folder has no extension, so "/etc/*.md" is
         * refused here even though it is legal for a filename.
         *
         * Notice, a trailing slash is trimmed from both sides, since "/etc/foo" and "/etc/foo/" are
         * the same folder and Hyperlambda is written both ways.
         */
        internal static bool MatchesFolder(string pattern, string folder)
        {
            pattern = pattern.TrimEnd('/');
            folder = folder.TrimEnd('/');

            // No wildcard, hence an exact folder.
            if (!pattern.Contains('*'))
                return Wildcard.Matches(pattern, folder);

            if (Path.GetFileName(pattern) != "*")
                throw new HyperlambdaException($"'{pattern}' is not a legal folder in a vocabulary, the only legal pattern is '/foo/*'");

            return Folder(folder) == Folder(pattern);
        }

        /*
         * Returns the folder part of the specified path, spelled the same regardless of which
         * directory separator the platform prefers.
         */
        static string Folder(string path)
        {
            return Path.GetDirectoryName(path)?.Replace('\\', '/');
        }

        /*
         * Commonalities between copy and move slots for both files and folders.
         */
        internal static async Task CopyMoveHelperAsync(
            ISignaler signaler,
            IRootResolver rootResolver,
            Node input,
            IIOService service,
            bool copy,
            bool isFolder)
        {
            // Sanity checking arguments and evaluating them.
            SanityCheckArguments(input);
            await signaler.SignalAsync("eval", input, skipWhitelist: true);

            // Retrieving source and destination path.
            var (Source, Destination) = GetCopyMovePaths(signaler, input, rootResolver, isFolder);

            // Checking if IO object exists, at which point we delete it.
            if (await service.ExistsAsync(Destination))
                await service.DeleteAsync(Destination);


            // Copying or moving file depending upon caller's needs.
            if (copy)
                await service.CopyAsync(
                    Source,
                    Destination);
            else
                await service.MoveAsync(
                    Source,
                    Destination);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Sanity checks arguments for copy and move file/folder.
         */
        static void SanityCheckArguments(Node input)
        {
            if (!input.Children.Any())
                throw new HyperlambdaException("No destination provided to [io.file.copy]");
        }

        /*
         * Retrieves source and destination path for copy/move file/folder.
         */
        static (string Source, string Destination) GetCopyMovePaths(
            ISignaler signaler,
            Node input,
            IRootResolver rootResolver,
            bool isFolder)
        {
            // Retrieving source and destination paths as specified by caller.
            var src = input.GetEx<string>();
            var dest = input.Children.First().GetEx<string>();

            // Normalising paths for folders.
            if (isFolder)
            {
                // Folders.
                if (!src.EndsWith("/"))
                    src += "/";
                if (!dest.EndsWith("/"))
                    dest += "/";
            }
            else
            {
                // Notice, we default the filename of destination to source's filename unless explicitly specified by caller.
                if (dest.EndsWith("/", StringComparison.InvariantCultureIgnoreCase))
                    dest += Path.GetFileName(src);
            }

            // Notice, the destination is verified too, since a copy writes to it.
            VerifyPath(signaler, input, dest, isFolder ? MatchesFolder : MatchesFile);

            // Transforming relative paths to absolute paths.
            var source = rootResolver.AbsolutePath(src);
            var destination = rootResolver.AbsolutePath(dest);

            // Sanity checking arguments.
            if (source == destination)
                throw new HyperlambdaException($"You cannot [{input.Name}] a file using the same source and destination path");

            // Returning arguments to caller.
            return (source, destination);
        }

        #endregion
    }
}
