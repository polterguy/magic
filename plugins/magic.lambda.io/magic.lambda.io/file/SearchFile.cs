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
        public Func<string, string, bool> Comparer => Utilities.MatchesFolder;
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

                var matches = FindMatches(signaler, filename, args.Pattern, args.IsRegex, args.CaseSensitive);
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

        static (string Folder, string Pattern, bool IsRegex, bool CaseSensitive, string[] Extensions) GetArgs(Node input)
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
                    .Select(x => x.StartsWith('.') ? x : "." + x)
                    .ToArray();

            var folder = input.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (folder, pattern, isRegex, caseSensitive, extensions);
        }

        static bool MatchesExtensions(string filename, string[] extensions)
        {
            if (extensions.Length == 0)
                return true;
            return extensions.Any(ext => filename.EndsWith(ext, StringComparison.InvariantCultureIgnoreCase));
        }

        /*
         * The .NET Regex engine provides no cancellation surface, so the remaining
         * execution deadline is handed to the engine as its match timeout - the same
         * pattern as the regex slots in magic.lambda.strings, letting [execution.timeout]
         * bound search work the same way it bounds any other statement. Without an
         * execution deadline the historical unbounded behaviour is preserved.
         */
        static TimeSpan MatchTimeout(ISignaler signaler)
        {
            var context = signaler.Peek<ExecutionContext>("execution.context");
            if (context?.DeadlineUtc == null)
                return Regex.InfiniteMatchTimeout;

            var remaining = context.DeadlineUtc.Value - DateTime.UtcNow;
            return remaining <= TimeSpan.Zero ? TimeSpan.FromMilliseconds(1) : remaining;
        }

        static System.Collections.Generic.List<int> FindMatches(ISignaler signaler, string filename, string pattern, bool isRegex, bool caseSensitive)
        {
            var result = new System.Collections.Generic.List<int>();
            Regex regex = null;
            if (isRegex)
            {
                var options = caseSensitive ? RegexOptions.None : RegexOptions.IgnoreCase;
                regex = new Regex(pattern, options, MatchTimeout(signaler));
            }

            var comparison = caseSensitive ? StringComparison.InvariantCulture : StringComparison.InvariantCultureIgnoreCase;
            var lineNumber = 0;
            foreach (var line in File.ReadLines(filename))
            {
                lineNumber++;
                if (isRegex)
                {
                    try
                    {
                        if (regex.IsMatch(line))
                            result.Add(lineNumber);
                    }
                    catch (RegexMatchTimeoutException)
                    {
                        /*
                         * Never echoing the pattern or the offending line - the message
                         * is returned to the caller, logged, and captured by exception
                         * handlers, and any of them can be huge.
                         */
                        throw new HyperlambdaException("Regular expression timed out and was aborted");
                    }
                }
                else
                {
                    if (line.Contains(pattern, comparison))
                        result.Add(lineNumber);
                }
            }

            return result;
        }

        #endregion
    }
}
