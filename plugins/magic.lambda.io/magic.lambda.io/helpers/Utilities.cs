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
         * Compares a whitelist vocabulary pin to a FILENAME, such as "/etc/*" or "/etc/*.md".
         */
        internal static bool MatchesFile(string pattern, string filename)
        {
            return Matches(pattern, filename, isFolder: false);
        }

        /*
         * Compares a whitelist vocabulary pin to a FOLDER, being a wildcard segment followed by
         * the trailing slash every folder carries by convention.
         *
         * Notice, a folder has no extension, hence an extension wildcard is refused here even
         * though the same wildcard is legal as a filename.
         */
        internal static bool MatchesFolder(string pattern, string folder)
        {
            return Matches(pattern, folder, isFolder: true);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Compares a pin to a path, segment by segment, which confines a wildcard to the segment it
         * occurs in exactly the way it is confined in a shell.
         *
         * Notice, every segment except the filename names a FOLDER, where the only legal wildcard is
         * "*" matching one level. Only the filename also accepts an extension, since an extension
         * on a folder segment is not something a folder can mean.
         */
        static bool Matches(string pattern, string path, bool isFolder)
        {
            var patternSegments = pattern.Split('/');
            var pathSegments = path.Split('/');
            if (patternSegments.Length != pathSegments.Length)
                return false;

            // A folder ends with a slash, hence has no filename segment at all.
            var filename = isFolder ? -1 : patternSegments.Length - 1;

            return patternSegments
                .Select((x, i) => MatchesSegment(x, pathSegments[i], i == filename))
                .All(x => x);
        }

        /*
         * Compares one segment to one pattern segment.
         */
        static bool MatchesSegment(string pattern, string segment, bool isFilename)
        {
            // A literal segment.
            if (!pattern.Contains('*'))
                return pattern == segment;

            // The entire segment, legal for a folder and a filename alike.
            if (pattern == "*")
                return true;

            // An extension, legal only as the filename.
            if (!isFilename || !pattern.StartsWith('*') || pattern.LastIndexOf('*') != 0)
                throw new HyperlambdaException($"'{pattern}' is not a legal segment in a vocabulary path, a wildcard is either an entire segment such as '*', or a filename extension such as '*.md'");

            return segment.EndsWith(pattern.Substring(1), StringComparison.Ordinal);
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
