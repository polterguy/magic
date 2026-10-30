/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.logging.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.mixin] slot for mxing static strings with the result of executing Hyperlambda.
    /// </summary>
    // 'text' added: a mixin template body is structurally arbitrary text, so any producer returning `text` (lambda2hyper, format, file-load, strings.upper, etc.) can legitimately wire as the template source. The `mixin-template` tag stays first so LinkedToValueKind on [strings.mixin]'s argument children keeps matching.
    [Slot(
        Name = "strings.mixin",
        Description = "Applies string interpolation from child expressions",
        ValueKind = "mixin-template,text",
        ValueDescription = "Template text to interpolate",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the rendered string after applying codebehind and expressions",
        SignatureType = typeof(global::magic.lambda.strings.signatures.StringMixinSignature))]
    public class Mixin : ISlotAsync
    {
        readonly ILogger _logger;

        public Mixin(ILogger logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Buffer to hold result of mixing invocation.
            var builder = new StringBuilder();

            // Checking if we're simply removing mixin Hyperlambda.
            var strip = input.Children.FirstOrDefault(x => x.Name == "strip")?.GetEx<bool>() ?? false;

            // Parsing string.
            using (var reader = new StringReader(input.GetEx<string>()))
            {
                int val;
                while ((val = reader.Read()) != -1)
                {
                    var ch = (char)val;
                    if (ch == '{' && (char)reader.Peek() == '{')
                    {
                        // Hyperlambda snippet, discarding second '{' character.
                        reader.Read();
                        builder.Append(await ReadSnippet(reader, signaler, input, strip));
                    }
                    else
                    {
                        builder.Append(ch);
                    }
                }
            }
            input.Value = builder.ToString();

            // House cleaning.
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Reads a mixin expression or Hyperlambda snippet, up until its closing "}}", and returns its result,
         * or an empty string when stripping. A snippet never closed is returned as the text it was.
         */
        private async Task<string> ReadSnippet(StringReader reader, ISignaler signaler, Node input, bool strip)
        {
            var snippet = new StringBuilder();
            while (true)
            {
                var val = reader.Read();
                if (val == -1)
                    return "{{" + snippet;

                var ch = (char)val;
                if (ch == '}' && (char)reader.Peek() == '}')
                {
                    // Done finding mixin expression or Hyperlambda.
                    reader.Read();
                    return strip ? "" : await ResolveMixin(signaler, input, snippet.ToString());
                }
                snippet.Append(ch);
            }
        }

        private async Task<string> ResolveMixin(ISignaler signaler, Node args, string hl)
        {
            try
            {
                if (!hl.Contains('\n') && !hl.Contains('\r'))
                    return ExecuteExpression(args, hl.Trim());

                var lambda = HyperlambdaParser.Parse(hl);
                lambda.Name = ".exe";
                var exe = new Node("invoke", Expression.Create("@.exe"));
                if (args.Children.Any())
                    exe.AddRange(args.Children.Select(x => x.Clone()));

                var wrapper = new Node();
                wrapper.Add(lambda);
                wrapper.Add(exe);
                await signaler.SignalAsync("eval", wrapper, skipWhitelist: true);
                return exe.Get<string>();
            }
            catch (Exception ex)
            {
                await _logger.ErrorAsync(ex.Message);
                return "{{" + hl + "}}";
            }
        }

        private static string ExecuteExpression(Node args, string expression)
        {
            var arguments = new Node(
                ".arguments",
                null,
                args.Children
                    .Where(x => x.Name != "strip")
                    .Select(x => x.Clone())
                    .ToList());
            var result = Expression.Create(expression).Evaluate(arguments).ToList();
            if (result.Count > 1)
                throw new HyperlambdaException("Multiple resulting nodes from mixin expression.");
            return result.FirstOrDefault()?.GetEx<string>() ?? "";
        }

        #endregion
    }
}
