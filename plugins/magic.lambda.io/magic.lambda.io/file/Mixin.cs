/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.mixin] slot for mixing a static content file with its associated Hyperlambda file.
    /// </summary>
    [Slot(Name = "io.file.mixin")]
    public class Mixin : ISlotAsync
    {
        readonly IFileService _fileService;
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;
        
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
            var codebehindFilename = _rootResolver.AbsolutePath(staticFilename.Substring(0, staticFilename.LastIndexOf('.')) + ".hl");
            var lambda = new Node();
            if (await _fileService.ExistsAsync(codebehindFilename))
            {
                lambda = HyperlambdaParser.Parse(await _fileService.LoadAsync(codebehindFilename));
                input.AddRange(lambda.Children);

                // Executing all [.oninit] lambda objects
                foreach (var idxInit in input.Children.Where(x => x.Name == ".oninit"))
                {
                    await signaler.SignalAsync("eval", idxInit);
                }
            }

            // Opening static file as a stream, and dynamically substituting content using "mixin logic".
            using (var reader = new StreamReader(await _streamService.OpenFileAsync(_rootResolver.AbsolutePath(staticFilename))))
            {
                // Executing mixin logic.
                input.Value = await Apply(signaler, reader, input, staticFilename);
            }
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Parses file and combines results from lambda invocations with static content.
         *
         * Notice {{.foo}} in the content file will invoke the [.foo] lambda object supplied,
         * and replace the reference in your content file with the return value from [.foo].
         */
        async Task<string> Apply(
            ISignaler signaler,
            StreamReader reader,
            Node lambda,
            string filename)
        {
            var builder = new StringBuilder();
            while (reader.Peek() != -1)
            {
                var cur = (char)reader.Read();
                switch (cur)
                {
                    // Escaped character, probably an escaped '{'.
                    case '\\':
                        builder.Append((char)reader.Read());
                        break;

                    // Probably the beginning of a scope.
                    case '{':
                        var next = (char)reader.Read();
                        if (next != '{')
                        {
                            builder.Append(cur).Append(next);
                            continue;
                        }
                        var lambdaExpression = ReadToEndOfScope(reader);
                        var exe = new Expression(lambdaExpression).Evaluate(lambda).FirstOrDefault() ??
                            throw new HyperlambdaException($"Expression '{lambdaExpression}' referenced in mixin file '{filename}' returned no nodes");
                        builder.Append(await ExecuteLambda(signaler, exe));
                        break;

                    default:
                        builder.Append(cur);
                        break;
                }
            }
            return builder.ToString();
        }

        /*
         * Helper method to read to end of lambda reference
         */
        string ReadToEndOfScope(StreamReader reader)
        {
            var builder = new StringBuilder();
            while (reader.Peek() != -1)
            {
                var cur = (char)reader.Read();
                switch (cur)
                {
                    // Escaped character, probably an escaped '}'.
                    case '\\':
                        builder.Append((char)reader.Read());
                        break;

                    // Probably the end of scope.
                    case '}':
                        var next = (char)reader.Read();
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
         * Helper method to execute lambda object and return result of invocation to caller.
         */
        async Task<string> ExecuteLambda(ISignaler signaler, Node lambda)
        {
            if (lambda.Value != null)
                return lambda.GetEx<string>(); // Simple "variable reference".

            // Executing node as lambda object, and returning the result of execution.
            var result = new Node();
            await signaler.ScopeAsync("slots.result", result, async () =>
            {
                // Storing original lambda object such that we can reset object after execution.
                var clone = lambda.Clone();

                // Executing lambda object.
                await signaler.SignalAsync("eval", lambda);

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
