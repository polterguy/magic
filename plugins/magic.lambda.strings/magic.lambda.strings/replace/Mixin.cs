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
    [Slot(Name = "strings.mixin")]
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
                while (true)
                {
                    // Checking for EOF.
                    var val = reader.Read();
                    if (val == -1)
                        break;

                    // Checking what character we're looking at.
                    var ch = (char)val;
                    switch (ch)
                    {
                        case '{':
                            if ((char)reader.Peek() == '{')
                            {
                                // Hyperlambda snippet, discarding second '{' character.
                                reader.Read();
                                var snippet = new StringBuilder();
                                var cont = true;
                                while (cont)
                                {
                                    val = reader.Read();
                                    if (val == -1)
                                    {
                                        builder.Append("{{");
                                        builder.Append(snippet.ToString());
                                        cont = false;
                                    }
                                    else
                                    {
                                        ch = (char)val;
                                        switch (ch)
                                        {
                                            case '}':
                                                if ((char)reader.Peek() == '}')
                                                {
                                                    // Done finding Hyperlambda.
                                                    reader.Read();
                                                    if (!strip)
                                                        builder.Append(await ExecuteHyperlambda(signaler, input, snippet.ToString()));
                                                    cont = false;
                                                }
                                                else
                                                    snippet.Append(ch);
                                                break;

                                            default:
                                                snippet.Append(ch);
                                                break;
                                        }
                                    }
                                }
                            }
                            else
                                builder.Append(ch); // Just a single '{' character.
                            break;

                        default:
                            builder.Append(ch);
                            break;
                    }
                }
            }
            input.Value = builder.ToString();

            // House cleaning.
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        private async Task<string> ExecuteHyperlambda(ISignaler signaler, Node args, string hl)
        {
            try
            {
                var lambda = HyperlambdaParser.Parse(hl);
                lambda.Name = ".exe";
                var exe = new Node("invoke", new Expression("@.exe"));
                if (args.Children.Any())
                {
                    exe.AddRange(args.Children.Select(x => x.Clone()));
                }
                var wrapper = new Node();
                wrapper.Add(lambda);
                wrapper.Add(exe);
                await signaler.SignalAsync("eval", wrapper);
                return exe.Get<string>();
            }
            catch (Exception ex)
            {
                await _logger.ErrorAsync(ex.Message);
                return "{{" + hl + "}}";
            }
        }

        #endregion
    }
}
