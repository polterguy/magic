/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.helpers;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.search] slot for searching files by content.
    /// </summary>
    [Slot(
        Name = "io.file.search",
        Description = "Searches for files on the server",
        ValueKind = "folder-path",
        ValueDescription = "Folder path to search from",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "file-search-result-list,node-list",
        ReturnsElementKind = "file-search-result,lambda-tree",
        ReturnsDescription = "Returns one child node per matching file, each containing [file] with the relative file path and [lines] with matching line numbers",
        SignatureType = typeof(global::magic.lambda.io.signatures.SearchFileSignature))]
    public class SearchFile : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesPath;
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public SearchFile(IRootResolver rootResolver, IFileService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var rootFolder = _rootResolver.AbsolutePath(args.Folder);
            var files = _service.ListAll(rootFolder);

            foreach (var filename in files)
            {
                if (!MatchesExtensions(filename, args.Extensions))
                    continue;

                var matches = FindMatches(filename, args.Pattern, args.IsRegex, args.CaseSensitive);
                if (matches.Count == 0)
                    continue;

                var item = new Node(".");
                item.Add(new Node("file", _rootResolver.RelativePath(filename)));
                var linesNode = new Node("lines");
                foreach (var line in matches)
                    linesNode.Add(new Node(".", line));
                item.Add(linesNode);
                input.Add(item);
            }

            input.Value = null;
            return Task.CompletedTask;
        }

        #region [ -- Private helper methods -- ]

        (string Folder, string Pattern, bool IsRegex, bool CaseSensitive, string[] Extensions) GetArgs(Node input)
        {
            var pattern = input.Children.FirstOrDefault(x => x.Name == "pattern")?.GetEx<string>();
            if (string.IsNullOrWhiteSpace(pattern))
                throw new HyperlambdaException("Missing required argument 'pattern'");

            var isRegex = input.Children.FirstOrDefault(x => x.Name == "regex")?.GetEx<bool>() ?? false;
            var caseSensitive = input.Children.FirstOrDefault(x => x.Name == "case-sensitive")?.GetEx<bool>() ?? false;

            var extValue = input.Children.FirstOrDefault(x => x.Name == "extensions")?.GetEx<string>();
            var extensions = string.IsNullOrWhiteSpace(extValue)
                ? Array.Empty<string>()
                : extValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .Where(x => x.Length > 0)
                    .Select(x => x.StartsWith(".") ? x : "." + x)
                    .ToArray();

            var folder = input.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (folder, pattern, isRegex, caseSensitive, extensions);
        }

        bool MatchesExtensions(string filename, string[] extensions)
        {
            if (extensions.Length == 0)
                return true;
            foreach (var ext in extensions)
            {
                if (filename.EndsWith(ext, StringComparison.InvariantCultureIgnoreCase))
                    return true;
            }
            return false;
        }

        System.Collections.Generic.List<int> FindMatches(string filename, string pattern, bool isRegex, bool caseSensitive)
        {
            var result = new System.Collections.Generic.List<int>();
            Regex regex = null;
            if (isRegex)
            {
                var options = caseSensitive ? RegexOptions.None : RegexOptions.IgnoreCase;
                regex = new Regex(pattern, options);
            }

            var comparison = caseSensitive ? StringComparison.InvariantCulture : StringComparison.InvariantCultureIgnoreCase;
            var lineNumber = 0;
            foreach (var line in File.ReadLines(filename))
            {
                lineNumber++;
                if (isRegex)
                {
                    if (regex.IsMatch(line))
                        result.Add(lineNumber);
                }
                else
                {
                    if (line.IndexOf(pattern, comparison) >= 0)
                        result.Add(lineNumber);
                }
            }

            return result;
        }

        #endregion
    }
}
