/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Collections.Concurrent;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.services;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.helpers;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.mixin] slot for mixing a static content file with its associated Hyperlambda file.
    /// </summary>
    [Slot(
        Name = "io.file.mixin",
        Description = "Loads a static file, applies same-named Hyperlambda codebehind, and returns the mixed result",
        ValueKind = "file-path",
        ValueDescription = "Path to the static file to mix with its same-named .hl codebehind file",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "mixed-file-content,text",
        ReturnsDescription = "Resolves to the mixed file content in value and any codebehind-produced child nodes",
        SignatureType = typeof(global::magic.lambda.io.signatures.FileMixinSignature))]
    public class Mixin : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesFile;
        readonly IFileService _fileService;
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;

        static readonly char[] _special = ['\\', '{'];

        /*
         * The text of the files recently mixed, by their full path, and the stamp of the file it was read from.
         */
        static readonly ConcurrentDictionary<string, CachedContent> _content = new();

        sealed record CachedContent(FileStamp Stamp, string Text);

        const int MaxCachedFiles = 256;
        const long MaxCachedFileLength = 256 * 1024;
        
        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="fileService">File service to use to resolve files</param>
        /// <param name="streamService">Needed to read content file</param>
        /// <param name="rootResolver">Root resolver used to find files with relative files paths</param>
        public Mixin(IFileService fileService, IStreamService streamService, IRootResolver rootResolver)
        {
            _fileService = fileService;
            _streamService = streamService;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Finding static filename and doing some basic sanity checking.
            var staticFilename = input.GetEx<string>() ??
                throw new HyperlambdaException("No filename specified for [mixin]");

            // Loading Hyperlambda codebehind file and parsing as lambda.
            var codebehindFilename = string.Concat(staticFilename.AsSpan(0, staticFilename.LastIndexOf('.')), ".hl");
            var lambda = new Node();
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(codebehindFilename)))
            {
                /*
                 * Loading through its slot rather than the file service, and deliberately WITHOUT
                 * exempting it from the whitelist.
                 *
                 * Notice, this path is DERIVED from the caller's filename by swapping its extension,
                 * hence is not the path the vocabulary granted when it granted [io.file.mixin] - a
                 * sandbox wanting mixin must grant reading the codebehind too, explicitly.
                 */
                var codebehind = new Node("io.file.load", codebehindFilename);
                await signaler.SignalAsync("io.file.load", codebehind);

                lambda = HyperlambdaParser.Parse(codebehind.Get<string>());
                input.AddRange(lambda.Children);

                /*
                 * Executing all [.oninit] lambda objects, masking any debug recorder while doing
                 * so - the codebehind file's statements are not part of the file being recorded.
                 */
                await signaler.ScopeAsync(".debug.recorder", null, async () =>
                {
                    foreach (var idxInit in input.Children.Where(x => x.Name == ".oninit"))
                    {
                        await signaler.SignalAsync("eval", idxInit, skipWhitelist: true);
                    }
                });
            }

            // Reading the static file, and dynamically substituting content using "mixin logic".
            input.Value = await Apply(signaler, await ReadContentAsync(staticFilename), input, staticFilename);
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns the content of the static file, as the text it is mixed with.
         *
         * A file is only read again when it has changed since the last time, which a page that is served over and over
         * would otherwise pay a read, a decode and a pile of buffers for on every request. Only done for files read through
         * the default services, and only for pages of a size that makes sense to keep in memory.
         */
        async Task<string> ReadContentAsync(string staticFilename)
        {
            var path = _rootResolver.AbsolutePath(staticFilename);
            if (_fileService is IFileStamps stamps && _streamService is StreamService)
            {
                var stamp = stamps.GetStamp(path);
                if (stamp != null && stamp.Value.Length <= MaxCachedFileLength)
                {
                    if (_content.TryGetValue(path, out var cached) && cached.Stamp == stamp.Value)
                        return cached.Text;

                    // Notice, the stamp was taken before the file was read, so a file changing meanwhile is read again next time.
                    var text = await ReadAsync(path);
                    if (_content.ContainsKey(path) || _content.Count < MaxCachedFiles)
                        _content[path] = new CachedContent(stamp.Value, text);
                    return text;
                }
            }
            return await ReadAsync(path);
        }

        async Task<string> ReadAsync(string path)
        {
            using (var reader = new StreamReader(await _streamService.OpenFileAsync(path)))
            {
                return await reader.ReadToEndAsync();
            }
        }

        /*
         * Parses file and combines results from lambda invocations with static content.
         *
         * Notice {{.foo}} in the content file will invoke the [.foo] lambda object supplied,
         * and replace the reference in your content file with the return value from [.foo].
         */
        async Task<string> Apply(
            ISignaler signaler,
            string content,
            Node lambda,
            string filename)
        {
            var builder = new StringBuilder(content.Length);
            var position = 0;
            while (position < content.Length)
            {
                // Copying everything up to the next character that means something, in one go.
                var special = content.IndexOfAny(_special, position);
                if (special == -1)
                {
                    builder.Append(content, position, content.Length - position);
                    break;
                }
                builder.Append(content, position, special - position);
                position = special;

                var cur = content[position++];
                switch (cur)
                {
                    // Escaped character, probably an escaped '{'.
                    case '\\':
                        builder.Append(Read(content, ref position));
                        break;

                    // Probably the beginning of a scope.
                    case '{':
                        var next = Read(content, ref position);
                        if (next != '{')
                        {
                            builder.Append(cur).Append(next);
                            continue;
                        }
                        var lambdaExpression = ReadToEndOfScope(content, ref position);
                        var exe = Expression.Create(lambdaExpression).Evaluate(lambda).FirstOrDefault() ??
                            throw new HyperlambdaException($"Expression '{lambdaExpression}' referenced in mixin file '{filename}' returned no nodes");
                        builder.Append(await ExecuteLambda(signaler, exe));
                        break;
                }
            }
            return builder.ToString();
        }

        /*
         * Helper method to read to end of lambda reference
         */
        static string ReadToEndOfScope(string content, ref int position)
        {
            var builder = new StringBuilder();
            while (position < content.Length)
            {
                var cur = content[position++];
                switch (cur)
                {
                    // Escaped character, probably an escaped '}'.
                    case '\\':
                        builder.Append(Read(content, ref position));
                        break;

                    // Probably the end of scope.
                    case '}':
                        var next = Read(content, ref position);
                        if (next != '}')
                        {
                            builder.Append(cur).Append(next);
                            continue;
                        }
                        return builder.ToString();

                    default:
                        builder.Append(cur);
                        break;
                }
            }
            throw new HyperlambdaException("Server side include was never closed!");
        }

        /*
         * Returns the next character, or '\uffff' at the end of the content, which is what casting the -1 a StreamReader
         * returns there to a char gives, and what this has always done to a file ending in a backslash or a single brace.
         */
        static char Read(string content, ref int position)
        {
            return position < content.Length ? content[position++] : '\uffff';
        }

        /*
         * Helper method to execute lambda object and return result of invocation to caller.
         */
        static async Task<string> ExecuteLambda(ISignaler signaler, Node lambda)
        {
            if (lambda.Value != null)
                return lambda.GetEx<string>(); // Simple "variable reference".

            // Executing node as lambda object, and returning the result of execution.
            var result = new Node();
            await signaler.ScopeAsync("slots.result", result, async () =>
            {
                // Storing original lambda object such that we can reset object after execution.
                var clone = lambda.Clone();

                // Executing lambda object, masking any debug recorder the same way [.oninit] does.
                await signaler.ScopeAsync(".debug.recorder", null, async () =>
                {
                    await signaler.SignalAsync("eval", lambda, skipWhitelist: true);
                });

                // Making sure we put lambda object back to its original state after execution.
                lambda.Clear();
                lambda.AddRange(clone.Children);
                lambda.Value = clone.Value;
            });
            return result.GetEx<string>();
        }

        #endregion
    }
}
